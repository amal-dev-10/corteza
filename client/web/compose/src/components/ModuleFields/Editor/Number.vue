<template>
  <b-form-group
    :data-test-id="getFieldCypressId(label)"
    :label-cols-md="horizontal && '5'"
    :label-cols-xl="horizontal && '4'"
    :content-cols-md="horizontal && '7'"
    :content-cols-xl="horizontal && '8'"
    :class="formGroupStyleClasses"
  >
    <template
      #label
    >
      <div
        v-if="!valueOnly"
        class="d-flex align-items-center text-primary p-0"
      >
        <span
          :title="label"
          class="d-inline-block mw-100"
        >
          {{ label }}
        </span>

        <c-hint :tooltip="hint" />

        <slot name="tools" />
      </div>
      <div
        class="small text-muted"
        :class="{ 'mb-1': description }"
      >
        {{ description }}
      </div>
    </template>

    <multi
      v-if="field.isMulti"
      v-slot="ctx"
      :value.sync="value"
      :errors="errors"
    >
      <b-input-group
        :prepend="field.options.prefix"
        :append="field.options.suffix"
      >
        <b-form-input
          :value="value[ctx.index]"
          autocomplete="off"
          type="number"
          number
          @input="setMultiValue($event, ctx.index)"
        />
      </b-input-group>
    </multi>

    <template v-else>
      <b-input-group
        :prepend="field.options.prefix"
        :append="field.options.suffix"
      >
        <b-form-input
          v-model="value"
          autocomplete="off"
          type="number"
          number
        />
      </b-input-group>
      <errors :errors="errors" />
    </template>
  </b-form-group>
</template>
<script>
import base from './base'

export default {
  extends: base,
}
</script>
