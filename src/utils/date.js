export const DAYS=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
export const dayLabels={MONDAY:'Lundi',TUESDAY:'Mardi',WEDNESDAY:'Mercredi',THURSDAY:'Jeudi',FRIDAY:'Vendredi',SATURDAY:'Samedi',SUNDAY:'Dimanche'};
export function dateKey(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Douala'}).format(d)}
export function localTime(d=new Date()){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Douala',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}
export function localDay(d=new Date()){return new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Douala',weekday:'long'}).format(d).toUpperCase()}
export function formatLongDate(date){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Douala',weekday:'long',day:'numeric',month:'long'}).format(new Date(`${date}T12:00:00`))}
export function minutes(t){const [h,m]=t.split(':').map(Number);return h*60+m}
export function duration(a,b){return minutes(b)-minutes(a)}
