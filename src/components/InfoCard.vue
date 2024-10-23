<template>
  <div class="info-card">
    <div class="info-card__header">
      <slot name="header" />
    </div>
    <div class="info-card__body">
      <slot />
    </div>
    <div class="info-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style>
.info-card {
  position: relative;
  display: grid;
  gap: 16px;
  border-radius: 12px;
  padding: 16px;
  background-color: var(--color-gray-light);
  box-shadow:
    0 1 4 0 rgba(12, 12, 13, 0.05),
    0 1 4 0 rgba(12, 12, 13, 0.1);
}
.info-card__header {
  font-weight: 600;
  line-height: 18.75px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.info-card__body {
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.info-card__footer {
  font-size: 14px;
  font-weight: 600;
  line-height: 16.41px;
  letter-spacing: 0.5px;
}

@media (min-width: 768px) {
  .info-card__body {
    flex-direction: row;
  }
}
</style>
