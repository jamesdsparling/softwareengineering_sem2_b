class Ticket {
    ticket_ID;
    customer_ID;
    space_ID;
    startTime;
    endTime;

    constructor(ticket_ID, customer_ID, space_ID, startTime, endTime) {
        this.ticket_ID = ticket_ID;
        this.customer_ID = customer_ID;
        this.space_ID = space_ID;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    timeRemaining() {
        return this.endTime - this.startTime;
    }
}