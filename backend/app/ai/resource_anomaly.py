"""
Resource anomaly detection using Z-score over a 7-day rolling window.
Applies to all metric types: electricity, water, devices, bandwidth.
"""
import datetime
import pandas as pd
from sqlalchemy.orm import Session
from app import models


def detect_resource_anomalies(db: Session, z_threshold: float = 2.5) -> list[dict]:
    """
    Scan all departments + metric types for anomalous readings
    in the last 7 days. Returns a list of anomaly dicts.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    readings = (
        db.query(models.SensorReading, models.Department.name)
        .join(models.Department)
        .filter(models.SensorReading.recorded_at >= cutoff)
        .all()
    )

    if not readings:
        return []

    rows = [
        {
            "dept_id": r.SensorReading.department_id,
            "dept_name": r.name,
            "metric": r.SensorReading.metric.value,
            "value": r.SensorReading.value,
            "recorded_at": r.SensorReading.recorded_at,
        }
        for r in readings
    ]
    df = pd.DataFrame(rows)

    anomalies = []
    for (dept_id, metric), group in df.groupby(["dept_id", "metric"]):
        if len(group) < 5:
            continue
        mean = group["value"].mean()
        std = group["value"].std()
        if std == 0:
            continue
        for _, row in group.iterrows():
            z = abs((row["value"] - mean) / std)
            if z > z_threshold:
                anomalies.append({
                    "department_id": dept_id,
                    "department_name": row["dept_name"],
                    "metric": metric,
                    "recorded_at": row["recorded_at"],
                    "value": row["value"],
                    "expected_mean": round(mean, 2),
                    "z_score": round(z, 2),
                })
    return anomalies
