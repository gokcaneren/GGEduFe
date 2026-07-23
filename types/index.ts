export type UserRole = 0 | 1;

export interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: boolean;
  isTeacher: boolean;
}

// Backend'den gelen ham response tipi
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

export interface UserSignInOutputDto {
  id: string;
  token: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface BookingRequestOutputDto {
  id: string;
  studentId: string;
  availabilityCourseSlotId: string;
  courseId: string;
  courseStartDate: string | null;
  courseEndDate: string | null;
  courseName: string;
  courseCode: string;
  firstName: string;
  lastName: string;
  email: string;
  photo: string;
}

export interface SubscriberOutputDto {
  studentId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  photo: string;
}

export type Currency = 0 | 1 | 2 | 3 | 4 | 5; // 0=TRY, 1=USD, 2=EUR, 3=CNY, 4=KRW, 5=JPY

export interface TeacherCourseOutputDto {
  id: string;
  price: number;
  durationMinutes: number;
  currency: Currency;
  courseId: string;
  name: string;
  code: string;
}

export interface TeacherDetailOutputDto {
  displayName: string | null;
  bio: string | null;
  durationMinutes: number;
  timeZoneId: string;
  userId: string;
  teacherCourses: TeacherCourseOutputDto[] | null;
}

export interface CourseOutputDto {
  id: string;
  name: string;
  code: string;
}

export interface TeacherCourseInputDto {
  id?: string;
  price: number;
  durationMinutes: number;
  currency: Currency;
  courseId: string;
}

export interface TeacherProfileUpdateInputDto {
  displayName: string | null;
  bio: string | null;
  teacherCourses: TeacherCourseInputDto[];
}

export type LanguageLevel = 0 | 1 | 2 | 3; // 0=Native, 1=Advanced, 2=Intermediate, 3=Beginner

export interface TeacherLanguageOutputDto {
  id: string;
  languageId: string;
  languageCode: string;
  languageLevel: LanguageLevel;
  languageLevelName: string;
}

export interface TeacherLanguageInputDto {
  languageId: string;
  languageLevel: LanguageLevel;
}

export interface LanguageOutputDto {
  id: string;
  code: string;
}

export interface LanguageLevelOutputDto {
  id: number;
  name: string;
}

// ─── CourseTemplate ───────────────────────────────────────
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CourseTemplateSimpleOutputDto {
  id: string;
  courseId: string;
  courseCode: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startLocalTime: string; // "HH:mm:ss"
  endLocalTime: string;
}

export interface CourseTemplateWithCourseOutputDto {
  id: string;
  teacherCourseId: string;
  courseId: string;
  name: string;
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startLocalTime: string;
  endLocalTime: string;
  timeZoneId: string;
  autoGenerateSlots: boolean;
  generateDaysAhead: number;
  isActive: boolean;
  effectiveFrom: string | null; // "YYYY-MM-DD"
  effectiveTo: string | null;
}

export interface CourseTemplateInputDto {
  teacherCourseId: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startLocalTime: string; // "HH:mm:ss"
  endLocalTime: string;
  timeZoneId: string;
  autoGenerateSlots: boolean;
  generateDaysAhead: number;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NotificationOutputDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  createdAt: string;
}

export type NotificationType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0=BookingRequest, 1=BookingAccepted, 2=BookingRejected, 3=BookingCancelled
// 4=SubscriptionRequest, 5=SubscriptionAccepted, 6=SubscriptionRejected

export interface UserProfileOutputDto {
  firstName: string;
  lastName: string;
  photo: string;
  email: string;
  gender: boolean;
}

export interface TeacherOutputDto {
  id: string;
  displayName: string | null;
  bio: string | null;
  durationMinutes: number;
  timeZoneId: string;
  userId: string;
}

export interface TeacherCourseProfileOutputDto {
  id: string;
  price: number;
  durationMinutes: number;
  currency: Currency;
}

export type SubscriptionStatus = 0 | 1 | 2 | 3;
// 0=Requested, 1=Accepted, 2=Rejected, 3=Cancelled

export interface TeacherAllDetailsOutputDto {
  userProfileDetail: UserProfileOutputDto;
  teacherProfileDetail: TeacherOutputDto;
  teacherCourseProfileDetail: TeacherCourseProfileOutputDto;
  teacherLanguageProfileDetails: TeacherLanguageOutputDto[];
  subscriptionStatus: SubscriptionStatus | null;
}

export interface SubscribeState {
  loading: boolean;
  success: boolean;
  error: string;
}

export type AvailabilityCourseSlotStatus = 0 | 1 | 2 | 3;
// 0=Available, 1=Pending, 2=Booked, 3=Cancelled

export interface AvailabilityCourseSlotOutputDto {
  id: string;
  startAtUtc: string;
  endAtUtc: string;
  status: AvailabilityCourseSlotStatus;
  courseTemplateId: string;
}

export interface TeacherCourseWithCourseSlotOutputDto {
  teacherCourseId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  price: number;
  durationMinutes: number;
  currency: Currency;
  courseSlots: AvailabilityCourseSlotOutputDto[];
}

export interface SubbedTeacherDetailOutputDto {
  teacherId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  photo: string;
  gender: boolean;
  teacherCourses: TeacherCourseOutputDto[] | null;
}