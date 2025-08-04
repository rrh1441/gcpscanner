import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

// Export a stub pool for backward compatibility
// This is no longer used in GCP implementation
export const pool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({ release: () => {} }),
  end: async () => {}
};

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
// Function overloads for backward compatibility
export function insertArtifact(artifact: ArtifactInput): Promise<number>;
export function insertArtifact(
  type: string,
  val_text: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
  meta?: any
): Promise<number>;
export function insertArtifact(
  type: string,
  val_text: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
  meta: any,
  unused?: any
): Promise<number>;
export async function insertArtifact(
  artifactOrType: ArtifactInput | string,
  val_text?: string,
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
  meta?: any,
  unused?: any
): Promise<number> {
  // Handle legacy 4 or 5 parameter calls
  if (typeof artifactOrType === 'string') {
    const artifact: ArtifactInput = {
      type: artifactOrType,
      val_text: val_text || '',
      severity: severity || 'INFO',
      meta: meta || {}
    };
    return insertArtifactInternal(artifact);
  }
  
  // Handle new single-parameter calls
  return insertArtifactInternal(artifactOrType as ArtifactInput);
}

async function insertArtifactInternal(artifact: ArtifactInput): Promise<number> {
  try {
    // Sanitize undefined values to null for Firestore compatibility
    const sanitizedArtifact: any = { ...artifact };
    Object.keys(sanitizedArtifact).forEach(key => {
      if (sanitizedArtifact[key] === undefined) {
        sanitizedArtifact[key] = null;
      }
    });
    
    const docRef = await firestore.collection('artifacts').add({
      ...sanitizedArtifact,
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

// Insert finding into Firestore
// Function overloads for insertFinding backward compatibility
export function insertFinding(finding: any): Promise<number>;
export function insertFinding(
  artifactId: number,
  findingType: string,
  recommendation: string,
  description?: string,
  reproCommand?: string
): Promise<number>;
export async function insertFinding(
  findingOrArtifactId: any | number,
  findingType?: string,
  recommendation?: string,
  description?: string,
  reproCommand?: string
): Promise<number> {
  // Handle legacy 4 or 5 parameter calls
  if (typeof findingOrArtifactId === 'number' && findingType) {
    const finding = {
      artifact_id: findingOrArtifactId,
      finding_type: findingType,
      recommendation: recommendation || '',
      description: description || '',
      repro_command: reproCommand || null
    };
    return insertFindingInternal(finding);
  }
  
  // Handle new single-parameter calls
  return insertFindingInternal(findingOrArtifactId);
}

async function insertFindingInternal(finding: any): Promise<number> {
  try {
    // Sanitize undefined values to null for Firestore compatibility
    const sanitizedFinding: any = { ...finding };
    Object.keys(sanitizedFinding).forEach(key => {
      if (sanitizedFinding[key] === undefined) {
        sanitizedFinding[key] = null;
      }
    });
    
    const docRef = await firestore.collection('findings').add({
      ...sanitizedFinding,
      created_at: new Date().toISOString()
    });
    
    // Return a fake ID for compatibility
    return Date.now();
  } catch (error) {
    console.error('Failed to insert finding:', error);
    throw error;
  }
}

