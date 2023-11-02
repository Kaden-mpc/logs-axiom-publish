# Axiom Publisher From PM2

## Description

This pm2 module publishes logs from pm2 to axiom.

## Installation

```bash
pm2 install Kaden-mpc/logs-axiom-publish
```

## Configuration

```bash
pm2 set logs-axiom-publish:axiom_token <token>
pm2 set logs-axiom-publish:axiom_org <org id>
pm2 set logs-axiom-publish:axiom_dataset <dataset>
pm2 set logs-axiom-publish:out <path to out file>
pm2 set logs-axiom-publish:err <path to err file>
pm2 set logs-axiom-publish:interval <interval in ms to flush axiom>
```
