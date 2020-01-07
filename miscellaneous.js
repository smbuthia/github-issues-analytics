const getMonday = (date) => {
  date = new Date(date);
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6:1); 
  return new Date(date.setDate(diff));
};

const addDaysToDate = (date, days) => {
  date.setDate(date.getDate() + days);
  return new Date(date);
};

const addValues = (runningTotal, hours) => {
  return runningTotal + hours;
};

const getAverage = stats => {
  return round(stats.reduce(addValues, 0) / stats.length, 2);
};

const round = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier)/multiplier;
};

const getTimeDiffInHrs = (date1, date2) => {
  if(!date1 || !date2){
    return null;
  }
  return round((new Date(date1) - new Date(date2)) / (1000 * 60 * 60), 0);
};

const hrsToDys = timeInHrs => {
  return round(timeInHrs / 24, 0);
};

module.exports = {
  getMonday: getMonday,
  addDaysToDate: addDaysToDate,
  addValues: addValues,
  getAverage: getAverage,
  getTimeDiffInHrs: getTimeDiffInHrs,
  hrsToDys: hrsToDys
};