<template>
  <div>
    <b-form-group>
      <b-form-checkbox
        v-model="value.enabled"
        :value="true"
        :unchecked-value="false"
      >
        {{ $t('enabled') }}
      </b-form-checkbox>
    </b-form-group>

    <b-form-group
      :label="$t('handle')"
      label-class="text-primary"
    >
      <b-input-group>
        <b-form-input
          v-model.trim="value.handle"
          :formatter="alphanum"
          :disabled="!fresh"
        />
      </b-input-group>
    </b-form-group>

    <b-form-group
      :label="$t('issuer')"
      label-class="text-primary"
    >
      <b-input-group>
        <b-form-input
          v-model.trim="value.issuer"
          placeholder="https://issuer.tld"
        />
      </b-input-group>
      <b-form-text
        v-html="$t('issuerHint')"
      />
    </b-form-group>

    <b-form-group
      :label="$t('clientKey')"
      label-class="text-primary"
    >
      <b-input-group>
        <b-form-input v-model.trim="value.key" />
      </b-input-group>
    </b-form-group>

    <b-form-group
      :label="$t('clientSecret')"
      label-class="text-primary"
    >
      <b-input-group>
        <b-form-input v-model.trim="value.secret" />
      </b-input-group>
    </b-form-group>

    <b-form-group
      :label="$t('scope')"
      label-class="text-primary"
    >
      <b-input-group>
        <b-form-input
          v-model.trim="value.scope"
          :placeholder="$t('scopePlaceholder')"
        />
      </b-input-group>
      <b-form-text
        v-html="$t('scopeHint')"
      />
    </b-form-group>

    <security
      v-model="value.security"
    />
  </div>
</template>
<script>
import Security from './ExternalSecurity'

export default {
  name: 'OIDCExternalAuthProvider',

  i18nOptions: {
    namespaces: 'system.settings',
    keyPrefix: 'editor.external.oidc',
  },

  components: {
    Security,
  },

  props: {
    value: {
      type: Object,
      required: true,
    },
  },

  data () {
    const {
      enabled,
      key,
      secret,
      scope,
    } = this.value

    return {
      enabled,
      key,
      secret,
      scope,

      permittedRoles: [],
      prohibitedRoles: [],
      forcedRoles: [],
    }
  },

  computed: {
    fresh () {
      return Object.prototype.hasOwnProperty.call(this.value, 'fresh') && this.value.fresh
    },
  },

  methods: {
    alphanum (v) {
      return v.replace(/[^a-zA-Z0-9\-_]+/, '')
    },
  },
}
</script>
<style scoped lang="scss">
</style>
