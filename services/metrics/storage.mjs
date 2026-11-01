export const INCREMENT_SQL=`INSERT INTO daily_counters(day,environment,event,group_name,outcome,language,count)
SELECT ?,?,?,?,?,?,1 WHERE (SELECT COALESCE(SUM(count),0) FROM daily_counters WHERE day=?) < 10000
ON CONFLICT(day,environment,event,group_name,outcome,language) DO UPDATE SET count=count+1`;
export const cutoffDay=(now=Date.now())=>new Date(now-89*86400000).toISOString().slice(0,10);
export const PRUNE_SQL='DELETE FROM daily_counters WHERE day < ?';
