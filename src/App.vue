<template>
  <header>
    <div class="datepicker__wrapper">
      <button
        aria-label="Предыдущяя неделя"
        class="datepicker__arrow-button"
        @click="updateRange('prev')"
      >
        <IconChevronLeft />
      </button>
      <VDatePicker
        v-model="selectedDate"
        locale="ru-RU"
        mode="date"
        :attributes="dateAttributes"
        :popover="{ visibility: 'click', placement: 'bottom' }"
        :max-date="maxDate"
        trim-weeks
        is-required
        color="primary"
        class="datepicker"
      >
        <template #default="{ togglePopover }">
          <button
            aria-label="Выбрать дату"
            class="datepicker__toggle-button"
            @click="togglePopover"
          >
            <IconCalendar />
            <span>
              <span>{{ formatDate(dateRange.start) }}</span
              >&nbsp;-
              <span>{{ formatDate(dateRange.end) }}</span>
            </span>
          </button>
        </template>
      </VDatePicker>
      <button
        aria-label="Следующая неделя"
        class="datepicker__arrow-button"
        :disabled="dateRange.end >= maxDate"
        @click="updateRange('next')"
      >
        <IconChevronRight />
      </button>
    </div>
  </header>
  <main>
    <section class="section-card info-section">
      <InfoCard>
        <Transition name="fade">
          <div v-if="dataLoading" class="section-card__loading-indicator">
            <LoadingSpinner />
          </div>
        </Transition>
        <div>
          Средняя вероятность осадков: {{ precipitationProbabilityAvg }}%
        </div>
        <ProgressRing :progress="precipitationProbabilityAvg" />
        <template #header>
          <div>Вероятность осадков</div>
        </template>
        <template #footer>
          Влажность воздуха:
          <span class="font-normal">{{ relativeHumidityAvg }}%</span>
        </template>
      </InfoCard>
      <InfoCard>
        <Transition name="fade">
          <div v-if="dataLoading" class="section-card__loading-indicator">
            <LoadingSpinner />
          </div>
        </Transition>

        <div class="font-normal">
          Средний уровень облачности:
          {{ cloudCoverAvg }}%
        </div>
        <ProgressRing :progress="cloudCoverAvg" />
        <template #header>
          <div>Облачность</div>
        </template>
        <template #footer>
          Видимость на дорогах:
          <span class="font-normal">{{ visibilityKmAvg }}&nbsp;км</span>
        </template>
      </InfoCard>
    </section>
    <section class="section-card">
      <div class="section-card__header">
        <IconStat />
        <div>Динамика температуры</div>
      </div>
      <div class="section-card__body">
        <div class="chart-wrapper">
          <canvas ref="chartElementRef"></canvas>
        </div>
        <Transition name="fade">
          <div v-if="dataLoading" class="section-card__loading-indicator">
            <LoadingSpinner />
          </div>
        </Transition>
      </div>
    </section>
    <section v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeMount,
  onBeforeUnmount,
  watch,
  computed,
  type Ref,
} from 'vue'
import {
  Chart,
  Colors,
  Filler,
  Legend,
  Tooltip,
  LineElement,
  LinearScale,
  LineController,
  CategoryScale,
  PointElement,
  type TooltipItem,
  type ChartArea,
  type ChartConfiguration,
} from 'chart.js'
import IconCalendar from './components/icon/IconCalendar.vue'
import IconStat from './components/icon/IconStat.vue'
import IconChevronLeft from './components/icon/IconChevronLeft.vue'
import IconChevronRight from './components/icon/IconChevronRight.vue'
import InfoCard from './components/InfoCard.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import ProgressRing from './components/ProgressRing.vue'
import { firstDayOfWeek, offsetDate, formatLocalDate, avg } from './utils'
import type {
  ApiResponse,
  ApiError,
  ChartGradient,
  ChartGradientColor,
} from './types'

Chart.register(
  Colors,
  Filler,
  Legend,
  Tooltip,
  LineElement,
  LinearScale,
  LineController,
  CategoryScale,
  PointElement,
)

const DEFAULT_TIMEZONE = 'Europe/Moscow'
const DEFAULT_COORDS = [55.75396, 37.620393]
const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

const selectedDate = ref(new Date())
const data = ref<ApiResponse>()
const dataLoading = ref()
const errorMessage = ref()
const chartElementRef = ref<HTMLCanvasElement>()
let chart: Chart | undefined

const today = new Date()
const forecaseMaxDate = firstDayOfWeek(offsetDate(today, 14))
const maxDate = offsetDate(forecaseMaxDate, -1)

const chartGradient1 = ref<ChartGradient>({
  gradient: undefined,
  width: 0,
  height: 0,
})
const chartGradient2 = ref<ChartGradient>({
  gradient: undefined,
  width: 0,
  height: 0,
})

const chartConfig: ChartConfiguration<'line'> = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Температура',
        data: [],
        fill: 'start',
        borderColor: 'rgba(22, 177, 255, 1)',
        backgroundColor: function (context) {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) {
            return
          }
          return getGradient(ctx, chartArea, chartGradient1, [
            {
              offset: 1,
              color: 'rgba(22, 177, 255, 0.175)',
            },
            {
              offset: 0,
              color: 'rgba(22, 177, 255, 0)',
            },
          ])
        },
        tension: 0.1,
      },
      {
        label: 'Прошлый период',
        data: [],
        fill: 'start',
        borderColor: 'rgba(86, 202, 0, 1)',
        backgroundColor: function (context) {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) {
            return
          }
          return getGradient(ctx, chartArea, chartGradient2, [
            {
              offset: 1,
              color: 'rgba(86, 202, 0, 0.175)',
            },
            {
              offset: 0,
              color: 'rgba(86, 202, 0, 0)',
            },
          ])
        },
        tension: 0.1,
      },
    ],
  },
  options: {
    responsive: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Температура',
          align: 'end',
        },
        offset: true,
      },
      x: {
        ticks: {
          callback: function (value) {
            return this.getLabelForValue(value as number)
          },
          padding: 8,
          major: {
            enabled: true,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 16,
          boxHeight: 16,
          color: '#000000',
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        titleColor: '#000000',
        bodySpacing: 4,
        bodyColor: '#000000',
        backgroundColor: '#ffffff',
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: tooltipLabelCallback,
        },
      },
    },
  },
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateRange = computed(() => {
  const start = firstDayOfWeek(selectedDate.value)
  return {
    start,
    end: offsetDate(start, 6),
  }
})

const dateAttributes = computed(() => [
  {
    highlight: 'primary',
    dates: [{ start: dateRange.value.start, span: 7 }],
  },
])

const temperatureDataAvg = computed(() => {
  if (data.value?.hourly) {
    // сумма температур сгруппированные по датам
    const result = data.value.hourly.time.reduce<Record<string, number>>(
      (sum, date, index) => {
        const key = date.slice(0, 10)
        const value = data.value!.hourly.temperature_2m[index]
        if (sum[key] === undefined) {
          sum[key] = value
        } else {
          sum[key] += value
        }
        return sum
      },
      {},
    )
    const rangeStart = new Date(formatLocalDate(dateRange.value.start))
    return Object.entries(result).reduce<{
      labels: string[]
      temperatures: number[]
      previosPeriod: number[]
    }>(
      (acc, [dateString, sum]) => {
        const date = new Date(dateString)
        const avgValue = Math.round(sum / 24)
        if (date >= rangeStart) {
          acc.labels.push(formatDate(date))
          acc.temperatures.push(avgValue)
        } else {
          acc.previosPeriod.push(avgValue)
        }
        return acc
      },
      {
        labels: [],
        temperatures: [],
        previosPeriod: [],
      },
    )
  }
  return undefined
})

// для средних значений данные берутся с середины
// в запросе включен предыдущий период
const precipitationProbabilityAvg = computed(() => {
  const items = data.value?.hourly.precipitation_probability || []
  if (items.length) {
    return Math.round(avg(items.slice(items.length / 2)))
  }
  return 0
})

const relativeHumidityAvg = computed(() => {
  const items = data.value?.hourly.relative_humidity_2m || []
  if (items.length) {
    return Math.round(avg(items.slice(items.length / 2)))
  }
  return 0
})

const cloudCoverAvg = computed(() => {
  const items = data.value?.hourly.cloud_cover || []
  if (items.length) {
    return Math.round(avg(items.slice(items.length / 2)))
  }
  return 0
})

const visibilityKmAvg = computed(() => {
  const items = data.value?.hourly.visibility || []
  if (items.length) {
    // метры в километры
    return Math.round(avg(items.slice(items.length / 2)) / 1000)
  }
  return 0
})

onBeforeMount(fetchData)

onMounted(() => {
  if (chartElementRef.value) {
    chart = new Chart(chartElementRef.value, chartConfig)
  }
})

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy()
    chart = undefined
  }
})

watch(
  () => dateRange.value,
  (val, oldVal) => {
    if (
      formatLocalDate(val.start) === formatLocalDate(oldVal.start) &&
      formatLocalDate(val.end) === formatLocalDate(oldVal.end)
    ) {
      return
    }
    fetchData()
  },
)

watch(temperatureDataAvg, updateChart)

function getGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: ChartArea,
  chartGradient: Ref<ChartGradient>,
  colors: ChartGradientColor[],
) {
  const chartWidth = chartArea.right - chartArea.left
  const chartHeight = chartArea.bottom - chartArea.top
  if (
    !chartGradient.value.gradient ||
    chartGradient.value.width !== chartWidth ||
    chartGradient.value.height !== chartHeight
  ) {
    // Create the gradient because this is either the first render
    // or the size of the chart has changed
    chartGradient.value.width = chartWidth
    chartGradient.value.height = chartHeight
    chartGradient.value.gradient = ctx.createLinearGradient(
      0,
      chartArea.bottom,
      0,
      chartArea.top,
    )
    for (const color of colors) {
      chartGradient.value.gradient?.addColorStop(color.offset, color.color)
    }
  }

  return chartGradient.value.gradient
}

function tooltipLabelCallback(tooltipItem: TooltipItem<'line'>) {
  return `${tooltipItem.dataset.label} ${tooltipItem.formattedValue}°C`
}

function formatDate(date: Date) {
  return dateFormatter.format(date)
}

function updateRange(direction: 'prev' | 'next') {
  if (direction === 'next') {
    selectedDate.value = offsetDate(dateRange.value.end, 1)
  } else if (direction === 'prev') {
    selectedDate.value = offsetDate(dateRange.value.start, -1)
  }
}

function updateChart() {
  if (chart) {
    const temperatures = temperatureDataAvg.value?.temperatures || []
    const previosPeriod = temperatureDataAvg.value?.previosPeriod || []
    chart.data.labels = temperatureDataAvg.value?.labels.map((label, i) => [
      label,
      `${temperatures[i]}°C`,
      `${previosPeriod[i]}°C`,
    ])
    chart.data.datasets[0].data = temperatures
    chart.data.datasets[1].data = previosPeriod
    chart.update()
  }
}

async function fetchData() {
  try {
    dataLoading.value = true
    const params = new URLSearchParams({
      timezone: DEFAULT_TIMEZONE,
      latitude: String(DEFAULT_COORDS[0]),
      longitude: String(DEFAULT_COORDS[1]),
      hourly:
        'temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,visibility',
      // дата начала смещается на неделю для включения предыдущего периода
      start_date: formatLocalDate(offsetDate(dateRange.value.start, -7)),
      end_date: formatLocalDate(dateRange.value.end),
    })
    const url = `${API_BASE_URL}?${params.toString()}`
    const response = await fetch(url)
    const json = await response.json()
    if (response.ok) {
      data.value = json
      errorMessage.value = ''
    } else {
      const reason = (json as ApiError).reason
      throw new Error(reason)
    }
  } catch (error) {
    errorMessage.value = `Ошибка получения данных, ${(error as Error).message}`
    throw error
  } finally {
    dataLoading.value = false
  }
}
</script>

<style>
header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 0;
}

main {
  display: grid;
  gap: 16px;
  padding-bottom: 16px;
}

.section-card {
  display: grid;
  gap: 16px;
  border-radius: 12px;
  padding: 16px;
  background-color: var(--color-white);
}
.section-card__header {
  font-size: 16px;
  font-weight: 600;
  line-height: 18.75px;
  letter-spacing: 0.15px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-bottom: 12px;
}
.section-card__body {
  position: relative;
  overflow-x: auto;
}
.section-card__loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  z-index: 1;
}

.chart-wrapper {
  position: relative;
  aspect-ratio: 2 / 1;
}

@media (min-width: 768px) {
  .info-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chart-wrapper {
    position: relative;
    aspect-ratio: unset;
    height: 378px;
    display: flex;
    justify-content: center;
  }
  .info-section .progress-ring {
    flex-shrink: 0;
  }
}

.error-message {
  color: var(--color-red);
}

.datepicker__wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  gap: 8px;
  padding: 0 8px;
  border-radius: 8px;
  color: var(--color-gray-dark);
  background-color: var(--color-white);
  box-shadow: 0px 0px 3px 0px rgba(42, 45, 67, 0.25);
}
.datepicker__toggle-button {
  font-size: 14px;
  font-weight: 500;
  line-height: 16.41px;
  letter-spacing: 0.25px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.datepicker__arrow-button {
  width: 24px;
  height: 24px;
}
.datepicker__arrow-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.font-normal {
  font-weight: 400;
}
</style>
