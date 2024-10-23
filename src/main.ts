import { createApp } from 'vue'
import App from './App.vue'
//@ts-ignore некорректный экспорта типов в package.json модуля
import { setupCalendar, DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import './style.css'

createApp(App)
  .use(setupCalendar, {})
  .component('VDatePicker', DatePicker)
  .mount('#app')
