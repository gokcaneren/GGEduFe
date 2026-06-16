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
  role: UserRole;
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