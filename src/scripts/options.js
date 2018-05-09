import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import Options from '../components/options';

Vue.use(ElementUI)

new Vue({ // eslint-disable-line no-new
  el: '#app',
  render: h => h(Options),
})
