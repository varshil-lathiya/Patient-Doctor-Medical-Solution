const { DateTime } = require('luxon');

const TZ = 'Asia/Kolkata';

const nowIST       = ()  => DateTime.now().setZone(TZ);
const todayIST     = ()  => nowIST().toFormat('yyyy-MM-dd');        // e.g. "2026-05-03"
const currentTimeIST = () => nowIST().toFormat('HH:mm:ss');          // e.g. "18:30:00"

module.exports = { nowIST, todayIST, currentTimeIST, TZ };
