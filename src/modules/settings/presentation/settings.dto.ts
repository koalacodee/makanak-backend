import { type Static, t } from "elysia";

export const PointsSystemDto = t.Object({
	active: t.Optional(t.Boolean()),
	value: t.Optional(t.Number()),
	redemptionValue: t.Optional(t.Number()),
});

export const AnnouncementDto = t.Object({
	active: t.Optional(t.Boolean()),
	message: t.Optional(t.String()),
});

export const SocialMediaDto = t.Object({
	facebook: t.Optional(t.String()),
	instagram: t.Optional(t.String()),
	phone: t.Optional(t.String()),
	email: t.Optional(t.String({ format: "email" })),
});

export const PaymentInfoDto = t.Object({
	vodafoneCash: t.Optional(t.String()),
	instaPay: t.Optional(t.String()),
});

export const PromoDto = t.Object({
	isActive: t.Optional(t.Boolean()),
	attachWithFileExtension: t.Optional(t.String()),
	topBadge: t.Optional(t.String()),
	title: t.Optional(t.String()),
	description: t.Optional(t.String()),
	code: t.Optional(t.String()),
	buttonText: t.Optional(t.String()),
});

export const HeroDto = t.Object({
	badge: t.Optional(t.String()),
	titleLine1: t.Optional(t.String()),
	titleHighlight: t.Optional(t.String()),
	description: t.Optional(t.String()),
});

export const FeatureDto = t.Object({
	title: t.Optional(t.String()),
	description: t.Optional(t.String()),
});

export const JourneyStepDto = t.Object({
	title: t.Optional(t.String()),
	description: t.Optional(t.String()),
});

export const JourneyDto = t.Object({
	title: t.Optional(t.String()),
	steps: t.Optional(t.Array(JourneyStepDto)),
});

export const SectionsDto = t.Object({
	categoriesTitle: t.Optional(t.String()),
	categoriesSubtitle: t.Optional(t.String()),
});

export const TermDto = t.Object({
	title: t.Optional(t.String()),
	description: t.Optional(t.String()),
});

export const QualityDto = t.Object({
	title: t.Optional(t.String()),
	description: t.Optional(t.String()),
	hotline: t.Optional(t.String()),
});

export const InfoDto = t.Object({
	terms: t.Optional(t.Array(TermDto)),
	quality: t.Optional(QualityDto),
});

export const ContentDto = t.Object({
	hero: t.Optional(HeroDto),
	features: t.Optional(t.Array(FeatureDto)),
	journey: t.Optional(JourneyDto),
	sections: t.Optional(SectionsDto),
	info: t.Optional(InfoDto),
});

export const StoreSettingsDto = t.Object({
	pointsSystem: PointsSystemDto,
	deliveryFee: t.Number(),
	announcement: AnnouncementDto,
	socialMedia: SocialMediaDto,
	paymentInfo: PaymentInfoDto,
	promo: PromoDto,
	content: ContentDto,
	driverCancellationReasons: t.Optional(t.Array(t.String())),
	inventoryCancellationReasons: t.Optional(t.Array(t.String())),
});

export type StoreSettings = Static<typeof StoreSettingsDto>;
export type PointsSystem = Static<typeof PointsSystemDto>;
export type Announcement = Static<typeof AnnouncementDto>;
export type SocialMedia = Static<typeof SocialMediaDto>;
export type PaymentInfo = Static<typeof PaymentInfoDto>;
export type Promo = Static<typeof PromoDto>;
export type Content = Static<typeof ContentDto>;
