class Admin() {
    profileID;
    password;
    email;

    constructor(profile_ID, password, email) {
        this.profileID = profile_ID;
        this.password = password;
        this.email = email;
    }

    getProfileID() {
        return this.profileID;
    }

    getPassword() {
        return this.password;
    }

    getEmail() {
        return this.email;
    }
}