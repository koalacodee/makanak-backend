export interface Upload {
  uploadKey: string
  uploadExpiry: Date
}

export interface SignedUrl {
  signedUrl: string
  expirationDate: Date
}

export interface SignedUrlBatch {
  filename: string
  signedUrl: string
  expirationDate: Date
}

export interface WebhookDataFull {
  event: 'tus_completed'
  upload: {
    uploadId: string
    uploadExpiry: string // ISO 8601 format
    filePath?: string
    originalFilename?: string
    uploadLength?: number
    uploadKey: string
  }
  timestamp: string // ISO 8601 format
}

export interface WebhookDataBasic {
  event: 'upload_completed'
  timestamp: string // ISO 8601 format
  objectPath: string
  size: number
}

export interface SignedPutUrl {
  filename: string
  signedUrl: string
  expirationDate: Date
}

export interface ConvertToAvifRequest {
  objectPath: string
  deleteOriginal?: boolean
}

export interface ConvertToAvifResponse {
  avifObjectPath: string
  deletedOriginal: boolean
  size: number
}

// export type WebhookData = WebhookDataFull | WebhookDataBasic;

export class FileHub {
  private readonly baseUrl: string
  private readonly apiKey: string
  private static _instance: FileHub | null = null

  private constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  public static instance() {
    if (!FileHub._instance) {
      if (!process.env.FILEHUB_BASE_URL || !process.env.FILEHUB_API_KEY) {
        throw new Error('FILEHUB_BASE_URL and FILEHUB_API_KEY must be set')
      }
      FileHub._instance = new FileHub(
        process.env.FILEHUB_BASE_URL,
        process.env.FILEHUB_API_KEY,
      )
    }
    return FileHub._instance
  }

  async generateUploadToken(options: { expiresInMs: number }): Promise<Upload> {
    if (!this.apiKey) {
      throw new Error('FileHub API key is not set')
    }
    if (!this.baseUrl) {
      throw new Error('FileHub base URL is not set')
    }
    const response = await fetch(`${this.baseUrl}/api/uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Upload-Expires-In-Ms': options.expiresInMs.toString(),
      },
    })
    if (!response.ok) {
      throw new Error(`FileHub upload token request failed: ${response.status}`)
    }
    const data = await response.json()
    return {
      uploadKey: data.uploadKey,
      uploadExpiry: new Date(data.uploadExpiry),
    }
  }

  async getSignedUrl(
    objectName: string,
    expiresInMs: number = 3600,
  ): Promise<SignedUrl> {
    if (!this.apiKey) {
      throw new Error('FileHub API key is not set')
    }
    if (!this.baseUrl) {
      throw new Error('FileHub base URL is not set')
    }
    const response = await fetch(`${this.baseUrl}/api/uploads/signed-url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Object-Path': objectName,
        'Expires-In': expiresInMs.toString(),
      },
    })
    if (!response.ok) {
      throw new Error(`FileHub signed URL request failed: ${response.status}`)
    }
    const data = await response.json()
    return {
      signedUrl: data.signedUrl,
      expirationDate: new Date(data.expirationDate),
    }
  }

  async getSignedUrlBatch(
    fileNames: string[],
    expiresInMs: number = 3600000,
  ): Promise<SignedUrlBatch[]> {
    if (!this.apiKey) {
      throw new Error('FileHub API key is not set')
    }
    if (!this.baseUrl) {
      throw new Error('FileHub base URL is not set')
    }
    const response = await fetch(`${this.baseUrl}/api/uploads/sign-url/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filenames: fileNames,
        expiresIn: expiresInMs / 1000,
      }),
    })
    if (!response.ok) {
      const error = await response.text()
      console.error(error)
      throw new Error(
        `FileHub signed URL batch request failed: ${response.status} ${response.statusText} - ${error}`,
      )
    }
    const data = await response.json()
    return data
  }

  async getSignedPutUrl(
    expiresInSeconds: number,
    fileExtension: string,
  ): Promise<SignedPutUrl> {
    if (!this.apiKey) {
      throw new Error('FileHub API key is not set')
    }
    if (!this.baseUrl) {
      throw new Error('FileHub base URL is not set')
    }
    const response = await fetch(
      `${this.baseUrl}/api/uploads/signed-upload-url`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Expires-In': expiresInSeconds.toString(),
          'File-Extension': fileExtension,
        },
      },
    )
    if (!response.ok) {
      const error = await response.text()
      console.error(error)
      throw new Error(
        `FileHub signed upload URL request failed: ${response.status} ${response.statusText}`,
      )
    }
    const data = await response.json()
    return data
  }

  async convertToAvif(
    request: ConvertToAvifRequest,
  ): Promise<ConvertToAvifResponse> {
    if (!this.apiKey) {
      throw new Error('FileHub API key is not set')
    }
    if (!this.baseUrl) {
      throw new Error('FileHub base URL is not set')
    }
    const response = await fetch(`${this.baseUrl}/images/to-avif`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.text()
      console.error(error)
      throw new Error(
        `FileHub convert to AVIF request failed: ${response.status} ${response.statusText} - ${error}`,
      )
    }
    const data = await response.json()
    return data
  }
}

export default FileHub.instance()
