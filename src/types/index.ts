export type Role = "SUPER_ADMIN" | "EVENT_ADMIN" | "CHECKIN_STAFF" | "FINANCE_VIEWER";

export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export type PassStatus = "VALID" | "CHECKED_IN" | "REVOKED";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TicketTierDTO {
  id: string;
  name: string;
  tierCode: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
  reservedCount: number;
  availableCount: number;
  maxPerOrder: number;
  benefits: string[];
  saleStart: string;
  saleEnd: string;
  isAvailable: boolean;
  isSoldOut: boolean;
}

export interface EventDetailDTO {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  venueName: string;
  venueAddress: string;
  city: string;
  date: string;
  doorsOpenTime: string;
  bannerImage: string;
  rules: string[];
  faqs: Array<{ question: string; answer: string }>;
  ticketTypes: TicketTierDTO[];
}

export interface AttendeeInput {
  fullName: string;
  email: string; // College Email
  personalEmail?: string | null; // Personal Email for pass delivery & backup
  phone: string;
  phoneVerificationToken?: string;
  emailVerificationToken?: string;
  college: string;
  academicYear: string;
  branch: string;
}

export interface OrderItemInput {
  ticketTypeId: string;
  quantity: number;
}

export interface CheckoutReservationInput {
  eventId: string;
  attendee: AttendeeInput;
  items: OrderItemInput[];
}

export interface CheckoutReservationResult {
  registrationId: string;
  registrationNo: string;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  gatewayOrderId: string;
  paymentProvider: string;
}

export interface DigitalPassDTO {
  id: string;
  passCode: string;
  eventTitle: string;
  eventDate: string;
  doorsOpenTime: string;
  venueName: string;
  venueAddress: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePersonalEmail?: string | null;
  attendeePhone: string;
  college: string;
  academicYear: string;
  branch: string;
  ticketTypeName: string;
  registrationNo: string;
  qrToken: string;
  status: PassStatus;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

export interface CheckInVerificationResult {
  status: "VALID" | "ALREADY_CHECKED_IN" | "INVALID";
  message: string;
  pass?: DigitalPassDTO;
  checkedInAt?: string;
  operatorName?: string;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
