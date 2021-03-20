
exports.threeDaysFromToday = () => {
    var date = new Date(); // aws server is in UTC
    date.setDate(date.getDate() + 3);
    return date;
  }
  
exports.toWrittenDay = (day) => {
let days = [ 
    "sunday", 
    "monday",
    "tuesday", 
    "wednesday", 
    "thursday", 
    "friday", 
    "saturday"
]

return days[day]
}