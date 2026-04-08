# Global Supply Chain Anomaly Detection System

An end-to-end anomaly detection pipeline that scans 1M+ shipment records across 12 international trade routes, flags irregular transactions, and visualizes results in an interactive logistics dashboard.

## Features

- *Statistical Detection Pipeline* - Z-Score analysis, IQR outlier filtering, Isolation Forest, and Median Absolute Deviation run in sequence to flag anomalous shipments
- *Interactive Dashboard* - drill-down by route, filter by risk level or anomaly type, and inspect individual shipment records in under 30 seconds
- *12 International Routes* - monitors corridors across Asia-Pacific, Europe, Americas, Middle East, and Africa
- *Real-time KPIs* - live anomaly count, estimated financial risk, and pipeline status at a glance

## Results

- Identified *200+ irregular transactions* out of 1M+ records
- Saved an estimated *$150K* in potential logistics losses
- Reduced investigation time per flagged shipment to under *30 seconds*

## Tech Stack

| Layer | Tools |
|---|---|
| Data Processing | Python, Pandas |
| Detection Methods | Z-Score, IQR, Isolation Forest, MAD |
| Database | SQL |
| Visualization | Tableau-style interactive dashboard (HTML/CSS/JS, Chart.js) |

## Project Structure

├── index.html       # Dashboard UI
├── styles.css       # Component styles
└── app.js           # Detection logic, data pipeline, chart rendering


## Live Demo

[View Dashboard →](https://HninKyarPhyuKhin.github.io/supply-chain-anomaly/index.html)
