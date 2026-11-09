import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import './styles.css'
import './admin.css'
import { router } from './router'
import { pinia } from './store'
import { i18n } from './locales'

createApp(App).use(pinia).use(router).use(i18n).use(Antd).mount('#app')
