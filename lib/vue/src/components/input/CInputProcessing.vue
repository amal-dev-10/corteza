<template>
  <b-button
    :variant="variant"
    :disabled="disabled || processing"
    :size="size"
    class="d-inline-flex align-items-center justify-content-center"
    v-on="$listeners"
  >
    <slot />
    <b-spinner
      v-if="processing"
      :processing="processing"
      small
      class="ml-1"
    />
  </b-button>
</template>

<script>
export default {
  props: {
    variant: {
      type: String,
      default: 'primary',
    },
    size: {
      type: String,
      default: 'md',
    },
    processing: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
