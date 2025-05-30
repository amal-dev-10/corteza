<template>
  <b-modal
    v-model="isOpened"
    size="lg"
    lazy
    :hide-footer="!current"
    :title="current ? current.title : 'Workflow prompts'"
    :busy="isLoading"
    footer-class="d-flex"
    no-fade
    @hide="deactivate()"
  >
    <component
      :is="current.component"
      v-if="current"
      :payload="current.prompt.payload"
      :loading="isLoading"
      @submit="resume({ input: $event, prompt: current.prompt })"
    />

    <div
      v-else
    >
      <div
        v-for="({ key, title, age, prompt }) in list"
        :key="key"
        class="d-flex flex-grow-1 align-items-baseline mb-2"
      >
        <a
          class="p-0 mr-auto"
          @click="activate(prompt)"
        >
          {{ title }} -
          <time
            class="muted small"
            :datetime="prompt.createdAt"
          >
            {{ age }}
          </time>
        </a>
      </div>
    </div>

    <template
      v-if="current"
      #modal-footer
    >
      <b-button
        variant="link"
        class="mr-auto"
        @click="activate(true)"
      >
        &laquo; Back to list
      </b-button>
    </template>
  </b-modal>
</template>
<script lang="js">
import { mapGetters, mapActions } from 'vuex'
import definitions from './kinds/index.ts'
import { pVal } from './utils.ts'
import moment from 'moment'

export default {
  name: 'CPromptModal',
  computed: {
    ...mapGetters({
      isLoading: 'wfPrompts/isLoading',
      isActive: 'wfPrompts/isActive',
      prompts: 'wfPrompts/all',
    }),

    isOpened: {
      get () {
        return this.isActive
      },

      set (open) {
        if (!open) {
          this.deactivate()
        } else {
          this.activate()
        }
      },
    },

    list () {
      return this.prompts
        .filter(({ ref }) => !!definitions[ref] && !!definitions[ref].component)
        .map(prompt => ({ ...definitions[prompt.ref], prompt }))
        .filter(({ passive }) => !passive)
        .map(p => ({
          key: p.prompt.stateID,
          title: pVal(p.prompt.payload, 'title', 'Workflow prompt'),
          age: moment(p.prompt.createdAt).fromNow(),
          ...p,
        }))
    },

    current () {
      const c = this.$store.getters['wfPrompts/current']
      if (!c) {
        return undefined
      }

      return this.list.find(({ prompt }) => prompt.stateID === c.stateID)
    },
  },

  methods: {
    ...mapActions({
      remove: 'wfPrompts/remove',
      resume: 'wfPrompts/resume',
      activate: 'wfPrompts/activate',
      deactivate: 'wfPrompts/deactivate',
    }),

    clear () {
      this.deactivate()
    },
  },
}
</script>
