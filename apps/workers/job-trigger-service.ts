import express from 'express';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

const run = google.run('v1');

app.post('/', async (req, res) => {
  try {
    // Extract Pub/Sub message
    const pubsubMessage = req.body.message;
    const data = pubsubMessage.data
      ? Buffer.from(pubsubMessage.data, 'base64').toString('utf-8')
      : '{}';
    
    // Trigger Cloud Run Job
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    await run.namespaces.jobs.run({
      name: 'namespaces/precise-victory-467219-s4/jobs/scanner-job',
      auth: auth,
      requestBody: {
        overrides: {
          containerOverrides: [{
            env: [{
              name: 'PUBSUB_MESSAGE',
              value: pubsubMessage.data
            }]
          }]
        }
      }
    });
    
    res.status(200).send('Job triggered');
  } catch (error) {
    console.error('Error triggering job:', error);
    res.status(500).send('Error triggering job');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Job trigger service listening on port ${port}`);
});