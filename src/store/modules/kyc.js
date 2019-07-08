import axios from 'axios';
import _has from 'lodash/has';
import config from '../../config';

const civicSip = new civic.sip({ appId: config.CIVIC_APP_ID });

// initial state
const state = {
  run: false,
  isKyc: false,
  isWhite: false,
  loadingKyc: false
};

// getters
const getters = {};

// actions
const actions = {
  async check({ commit, dispatch }, address) {
    axios.get(config.API_KYC + '/check/' + address).then(r => {
      if (_has(r.data, 'result')) {
        commit(
          'isKyc',
          Boolean(r.data.result.check) || Boolean(r.data.result.white)
        );
        commit('isWhite', Boolean(r.data.result.white));
        dispatch('civicInit', address);
      }
    });
  },
  civicInit({ commit, state }, address) {
    if (state.run) {
      return;
    }
    commit('run');
    civicSip.on('auth-code-received', event => {
      const jwtToken = event.response;
      axios
        .get(config.API_KYC + '/civic/' + address + '/' + jwtToken)
        .then(r => {
          commit('isKyc', Boolean(r.data.result));
          commit('loadingKyc', false);
        })
        .catch(() => {
          commit('loadingKyc', false);
        });
    });
    civicSip.on('civic-sip-error', error => {
      // eslint-disable-next-line no-console
      console.log('   Error type = ' + error.type);
      // eslint-disable-next-line no-console
      console.log('   Error message = ' + error.message);
      commit('loadingKyc', false);
    });
    civicSip.on('user-cancelled', () => {
      commit('loadingKyc', false);
    });
  },
  setKyc({ commit }) {
    commit('loadingKyc', true);
    civicSip.signup({
      style: 'popup',
      scopeRequest: civicSip.ScopeRequests.PROOF_OF_IDENTITY
    });
  }
};

// mutations
const mutations = {
  run(state) {
    state.run = true;
  },
  isKyc(state, data) {
    state.isKyc = data;
  },
  isWhite(state, data) {
    state.isWhite = data;
  },
  loadingKyc(state, data) {
    state.loadingKyc = data;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};