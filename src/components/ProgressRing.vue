<template>
  <div class="progress-ring">
    <svg viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="linear-grad"
          gradient-units="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="24.3%" stop-color="#669ef1" />
          <stop offset="104.42%" stop-color="#b3d1fe" />
        </linearGradient>
      </defs>
      <circle
        cx="72"
        cy="72"
        r="60"
        stroke="#E1D9F3"
        stroke-width="24"
      ></circle>
      <circle
        cx="72"
        cy="72"
        r="60"
        stroke="url(#linear-grad)"
        stroke-width="24"
        :stroke-dasharray="dasharray"
        :stroke-dashoffset="dashoffset"
      ></circle>
    </svg>
    <span class="progress-ring__text">{{ progress }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * Прогресс в процентах
     */
    progress?: number
  }>(),
  {
    progress: 0,
  },
)

// 2 * pi * r
const dasharray = 376.8

const dashoffset = computed(
  () => dasharray - (dasharray * props.progress) / 100,
)
</script>

<style>
.progress-ring {
  width: 144px;
  height: 144px;
  position: relative;
}
.progress-ring svg {
  transform: rotate(-90deg);
}
.progress-ring__text {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  letter-spacing: 0.12px;
  text-align: center;
  color: #0f111e;
}
</style>
