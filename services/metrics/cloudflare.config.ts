import {bindings,defineConfig,triggers} from 'cf/config';
export default defineConfig({worker:{
  name:'zhuanmp3-counters',
  entrypoint:'./worker.mjs',
  compatibilityDate:'2026-11-01',
  workersDev:true,
  previewUrls:false,
  env:{COUNTERS:bindings.d1({id:'99eeb2cd-0243-448c-bbe6-734572112605',name:'zhuanmp3-counters'}),TEST_ORIGIN:bindings.text('http://127.0.0.1:5173')},
  triggers:[triggers.fetch({pattern:'zhuanmp3.com/api/metrics',zone:'zhuanmp3.com'}),triggers.scheduled({schedule:'15 3 * * *'})],
  observability:{enabled:true,redactQueryString:true,logs:{enabled:true,invocationLogs:false,headSamplingRate:0.01},traces:{enabled:true,headSamplingRate:0.01}}
}});
