class Customer {
    car;
    balance;

    constructor(car, balance) {
        this.car = car;
        this.balance = balance;
    }

    getCar() {
        return this.car;
    }

    getBalance() {
        return this.balance;
    }

    setCar(car) {
        this.car = car;
    }

    setBalance(balance) {
        this.balance = balance;
    }
}