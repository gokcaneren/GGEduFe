export class ApiConstants{
    static readonly api = "/api/"
    
}

export class BookingApi{
    static readonly booking = "Booking";
}

export class TeacherApi{
    static readonly teacher = "Teacher";
    static readonly teacherDetails = this.teacher + "/details";
}

export class CourseApi{
    static readonly course = "Course";
    static readonly allCourse = this.course + "/all"
}