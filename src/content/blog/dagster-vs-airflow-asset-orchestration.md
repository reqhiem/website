---
title: "Dagster vs. Airflow and Prefect: why asset-based orchestration wins"
description: "A pragmatic comparison of Dagster, Airflow, Prefect, and Flyte for modern data and ML pipelines. Why the asset-based model beats task-DAGs, with code, a cost model, and migration notes."
date: "2026-04-23"
category: "Tooling"
tags: ["data-engineering", "dagster", "airflow", "prefect", "orchestration", "mlops"]
author: "Joel Perca"
---

Every data platform I've inherited in the last five years had one thing in common: a graveyard of stale Airflow DAGs, each one re-running a brittle chain of tasks that nobody dared refactor because the lineage existed only in tribal knowledge. The orchestration layer was managing *procedures*, not *data*.

[Dagster](https://dagster.io/) inverts that. Instead of scheduling tasks that happen to produce data as a side effect, you declare the **data assets** you want to exist and let the orchestrator figure out when to materialize them. After porting two production pipelines and a research workflow away from Airflow, I think this is the single biggest win available in modern data engineering.

## TL;DR

- **Airflow** and classic **Prefect** schedule *tasks*: imperative units of work arranged into a DAG.
- **Dagster** schedules *assets*: declarative data objects with lineage, partitions, freshness policies, and type-checked I/O.
- The asset model makes **lineage, partial re-runs, data-quality checks, and testing** first-class — all the things that usually live in README files and tribal knowledge in Airflow shops.
- Local development in Dagster is the closest thing to "run it in a notebook" that serious orchestration tools offer.
- Airflow still wins on breadth of operators, conservative enterprise adoption, and non-data jobs (arbitrary shell, legacy systems).

## Tasks vs. assets, in one picture

A task-based DAG says "run `extract`, then `transform`, then `load`". The orchestrator has no idea what data comes out; that's your problem. If the downstream table gets corrupted, you kick off the whole DAG and hope.

An asset-based graph says "the `customers_clean` table is defined as `customers_clean = clean(customers_raw)`". The orchestrator now knows:

- Which inputs each asset depends on.
- What partitions (by date, region, tenant) each asset has.
- Which downstream assets become stale when an upstream one is re-materialized.
- What schema, type, and data-quality contract each asset must satisfy.

Formally, a pipeline is a directed acyclic graph $G = (V, E)$ over assets $V$. The cost of bringing the graph to a consistent state from a starting set of invalidated assets $I \subseteq V$ is

$$
C(I) = \sum_{v \in \mathrm{desc}(I)} c(v)
$$

where $\mathrm{desc}(I)$ are the transitive descendants of $I$ and $c(v)$ is the cost of materializing asset $v$. The asset model knows $\mathrm{desc}(I)$ exactly; the task model has to be told, usually by a human copy-pasting task IDs into a backfill command.

## The same pipeline in both worlds

A toy ETL: ingest a CSV, clean it, produce a summary table.

### Airflow 2.x (TaskFlow API)

```python
from airflow.decorators import dag, task
from datetime import datetime
import pandas as pd

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False)
def daily_sales_dag():
    @task
    def extract() -> str:
        df = pd.read_csv("s3://raw/sales.csv")
        path = "/tmp/sales.parquet"
        df.to_parquet(path)
        return path

    @task
    def clean(path: str) -> str:
        df = pd.read_parquet(path).dropna()
        out = "/tmp/sales_clean.parquet"
        df.to_parquet(out)
        return out

    @task
    def summary(path: str):
        df = pd.read_parquet(path)
        df.groupby("region")["amount"].sum().to_csv("/tmp/summary.csv")

    summary(clean(extract()))

daily_sales_dag()
```

The orchestrator sees three tasks connected by string-typed paths. It has no idea what `sales_clean` is, cannot enforce a schema on it, and can only re-run the whole DAG.

### Dagster (asset-based)

```python
from dagster import asset, AssetIn, Definitions
import pandas as pd

@asset
def sales_raw() -> pd.DataFrame:
    return pd.read_csv("s3://raw/sales.csv")

@asset(ins={"sales_raw": AssetIn()})
def sales_clean(sales_raw: pd.DataFrame) -> pd.DataFrame:
    return sales_raw.dropna()

@asset(ins={"sales_clean": AssetIn()})
def sales_by_region(sales_clean: pd.DataFrame) -> pd.DataFrame:
    return sales_clean.groupby("region", as_index=False)["amount"].sum()

defs = Definitions(assets=[sales_raw, sales_clean, sales_by_region])
```

Same three steps — but now Dagster knows three things it couldn't before: the outputs are typed `pd.DataFrame`, they have names that match a target storage location (managed by IO managers), and `sales_by_region` becomes stale automatically when `sales_raw` is re-materialized.

Add a partition definition and an asset check, and you get reliable backfills and data-quality enforcement without custom Python:

```python
from dagster import DailyPartitionsDefinition, asset, asset_check

daily = DailyPartitionsDefinition(start_date="2026-01-01")

@asset(partitions_def=daily)
def sales_raw(context): ...

@asset_check(asset=sales_raw)
def sales_raw_not_empty(sales_raw: pd.DataFrame):
    return {"passed": len(sales_raw) > 0}
```

Trying to express the equivalent in Airflow means wiring up `ExternalTaskSensor`s, custom XCom serializers, and a separate Great Expectations integration. It's doable — and I've done it — but the fact that you have to do it is exactly the problem.

## Comparison I trust

These are real differences I've hit in production, not feature-list trivia.

| Dimension              | Airflow                      | Prefect 2+                | Dagster                         | Flyte                         |
| ---------------------- | ---------------------------- | ------------------------- | ------------------------------- | ----------------------------- |
| Core model             | Task DAG                     | Flow of tasks             | **Asset graph**                 | Typed tasks + workflows       |
| Lineage                | External (OpenLineage)       | External                  | **First-class**                 | First-class                   |
| Partitions / backfill  | Per-DAG run dates            | Custom                    | **Per-asset, multi-dim**        | Per-task                      |
| Data-quality checks    | Add-on (Great Expectations)  | Add-on                    | **`@asset_check` native**       | External                      |
| Local dev UX           | Painful (Docker, scheduler)  | Good                      | **Excellent** (`dagster dev`)   | Moderate (K8s-first)          |
| Typing                 | Loose (XCom = pickle)        | Loose / optional          | **Strong (Python types + IO)**  | **Strong (Protobuf / types)** |
| Non-data jobs          | **Excellent** (operators)    | Good                      | OK (`Op`s for raw work)         | OK                            |
| Operator ecosystem     | Huge                         | Moderate                  | Moderate (growing)              | Small                         |
| Infra footprint        | Webserver + scheduler + DB   | Server + workers          | **Code-location + webserver**   | Kubernetes, mandatory         |
| Managed cloud          | Astronomer, MWAA             | Prefect Cloud             | **Dagster+**                    | Union.ai                      |

## Where Dagster hurts today

No tool is free.

- **Operator breadth.** Airflow has 1,500+ provider packages. Dagster integrations are growing fast but narrower; for niche SaaS connectors you may still have to write an `Op`.
- **Kubernetes-native ML.** If every workload is a GPU pod and you already live in K8s, Flyte's ergonomics around typed inputs, caching, and pod specs are still best-in-class.
- **Arbitrary non-data jobs.** Reporting-email senders, cleanup scripts, legacy shell pipelines — Airflow was built for this. Using Dagster for *only* non-data jobs is using a microscope as a hammer.
- **Team inertia.** A mature Airflow shop with 200 DAGs, custom sensors, and trained on-call rotations won't benefit from a rewrite unless the data-quality and lineage wins are genuinely urgent.

## Migration recipe

If you're starting fresh, pick Dagster. For an existing Airflow codebase, a staged migration is realistic:

1. **Wrap, don't rewrite.** Use Dagster's `@asset` to represent the *outputs* of your existing Airflow DAGs, and let Airflow trigger Dagster with [`DagsterCloudOperator`](https://docs.dagster.io/) or a plain HTTP call. You get lineage on what matters — the data — without rebuilding every task.
2. **Port the high-value tables first.** Tables with bad data-quality stories, frequent backfills, or opaque lineage benefit most. Leave the "runs for 2 years without touching it" DAGs alone.
3. **Adopt asset checks as you go.** Every time an on-call incident stems from "nobody noticed the upstream was null", codify that as an `@asset_check`. This is where Dagster pays back the investment.
4. **Keep Airflow for the long tail.** Reporting emails, vendor-API polling, cleanup jobs — don't fight it. Airflow is fine at these, and Dagster isn't trying to be.

For Prefect users, the translation is more direct: Prefect flows map closely to Dagster jobs, and most teams adopt assets incrementally alongside flows rather than replacing them wholesale.

## Closing thought

Orchestration has spent a decade optimizing the wrong abstraction. Tasks are implementation details; data is the contract. Dagster is the first mainstream orchestrator that treats assets as the object of interest, and once you've shipped a pipeline with typed I/O, automatic partitioning, and asset-level data checks, going back feels like debugging in print statements after using a real debugger.

It's not a silver bullet — Airflow is still the right answer for some teams and some workloads. But for greenfield data and ML platforms in 2026, asset-based orchestration is the default I'd reach for.

---

**Further reading**

- [Dagster documentation — Software-Defined Assets](https://docs.dagster.io/concepts/assets/software-defined-assets)
- [Airflow 2 TaskFlow API](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)
- [Data orchestration: a field guide](https://www.dagster.io/blog/data-orchestration-landscape-2024) — Dagster's own landscape survey, still the most honest I've read.
- [Flyte vs. Airflow (Union.ai)](https://www.union.ai/blog/flyte-vs-airflow) — useful for the K8s-native angle.
