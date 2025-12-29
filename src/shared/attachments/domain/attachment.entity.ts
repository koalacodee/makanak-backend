export interface Attachment {
	id: string;
	filename: string;
	targetId: string;
	size: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface AttachmentInput {
	filename: string;
	targetId: string;
	size: number;
}
