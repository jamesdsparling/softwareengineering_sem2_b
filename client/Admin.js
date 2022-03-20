class Admin {
    profile_ID;
    password;
    email;

    constructor(profile_ID, password, email) {
        this.profile_ID = profile_ID;
        this.password = password;
        this.email = email;
    }

    getProfile_ID() {
        return this.profile_ID;
    }

    getPassword() {
        return this.password;
    }

    getEmail() {
        return this.email;
    }
}