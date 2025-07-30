import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

export interface ArtifactInput {
  type: string;
  val_text: string;
  severity: string;
  src_url?: string;
  sha256?: string;
  mime?: string;
  meta?: any;
  description?: string;
  repro_command?: string;
}

// Insert artifact into Firestore
export async function insertArtifact(artifact: ArtifactInput): Promise<number> {
  try {
    const docRef = await firestore.collection('artifacts').add({
      ...artifact,
      created_at: new Date().toISOString(),
      scan_id: artifact.meta?.scan_id || 'unknown'
    });
    
    // Return a fake ID for compatibility
    return Date.now();
  } catch (error) {
    console.error('Failed to insert artifact:', error);
    throw error;
  }
}

// Stub for compatibility
export async function initializeDatabase(): Promise<void> {
  console.log('Using Firestore - no initialization needed');
}

// Export empty pool for compatibility
export const pool = {
  query: async () => ({ rows: [], rowCount: 0 }),
  end: async () => {}
};