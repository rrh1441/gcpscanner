import json
import os
from google.cloud import run_v2

def trigger_scan_worker(cloud_event):
    """Triggered by Pub/Sub message to start scan worker"""
    
    # Parse Pub/Sub message
    message_data = json.loads(cloud_event.data['message']['data'])
    
    # Create Cloud Run Job execution
    client = run_v2.JobsClient()
    
    job_name = f"projects/{os.environ['PROJECT_ID']}/locations/{os.environ['REGION']}/jobs/scanner-worker"
    
    execution = run_v2.Execution()
    execution.spec.template.spec.template.spec.containers[0].env = [
        {"name": "JOB_DATA", "value": json.dumps(message_data)}
    ]
    
    operation = client.run_job(name=job_name, execution=execution)
    print(f"Started job execution: {operation.name}")

def trigger_report_generator(cloud_event):
    """Triggered by Pub/Sub message to generate report"""
    
    # Parse Pub/Sub message  
    message_data = json.loads(cloud_event.data['message']['data'])
    
    # Create Cloud Run Job execution for report generation
    client = run_v2.JobsClient()
    
    job_name = f"projects/{os.environ['PROJECT_ID']}/locations/{os.environ['REGION']}/jobs/report-generator"
    
    execution = run_v2.Execution()
    execution.spec.template.spec.template.spec.containers[0].env = [
        {"name": "REPORT_REQUEST", "value": json.dumps(message_data)}
    ]
    
    operation = client.run_job(name=job_name, execution=execution)
    print(f"Started report generation: {operation.name}")