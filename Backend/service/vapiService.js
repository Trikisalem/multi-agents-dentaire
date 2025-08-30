const axios = require('axios');

class VapiService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseURL = 'https://api.vapi.ai';
    this.assistantId = process.env.VAPI_ASSISTANT_ID;
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    this.isListening = false;
  }

  // Activer la réception des appels entrants
  async activateIncomingCalls({ assistantId, phoneNumberId, webhookUrl }) {
    try {
      console.log('🟢 Activation Emma pour appels entrants...');

      // Configurer le numéro de téléphone pour recevoir les appels
      const phoneResponse = await axios.patch(`${this.baseURL}/phone-number/${phoneNumberId}`, {
        assistantId: assistantId,
        serverUrl: webhookUrl,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'emma-webhook-secret'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📞 Numéro configuré pour appels entrants');

      // Marquer comme actif
      this.isListening = true;

      return {
        success: true,
        data: {
          phoneNumberId,
          assistantId,
          webhookUrl,
          status: 'active'
        }
      };

    } catch (error) {
      console.error('❌ Erreur activation appels entrants:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Désactiver la réception des appels
  async deactivateIncomingCalls() {
    try {
      console.log('🔴 Désactivation Emma...');

      // Retirer l'assistant du numéro de téléphone
      const response = await axios.patch(`${this.baseURL}/phone-number/${this.phoneNumberId}`, {
        assistantId: null,
        serverUrl: null
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.isListening = false;

      return {
        success: true,
        message: 'Emma désactivée'
      };

    } catch (error) {
      console.error('❌ Erreur désactivation:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Vérifier les appels entrants (pour polling)
  async getIncomingCalls() {
    try {
      const response = await axios.get(`${this.baseURL}/call?limit=10`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      // Filtrer les appels récents et entrants
      const recentCalls = response.data.filter(call => {
        const callTime = new Date(call.createdAt);
        const now = new Date();
        const timeDiff = now - callTime;
        
        // Appels des 5 dernières minutes
        return timeDiff < 5 * 60 * 1000 && call.status === 'ringing';
      });

      return {
        success: true,
        incomingCall: recentCalls.length > 0 ? recentCalls[0] : null,
        activeCalls: response.data.filter(call => call.status === 'in-progress')
      };

    } catch (error) {
      console.error('❌ Erreur vérification appels entrants:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Répondre à un appel entrant
  async answerCall(callId, options = {}) {
    try {
      console.log('✅ Réponse à l\'appel:', callId);

      // Pour Vapi, répondre signifie généralement que l'assistant prend le contrôle
      // Ceci peut varier selon la configuration de votre assistant
      const response = await axios.post(`${this.baseURL}/call/${callId}/control`, {
        action: 'answer',
        assistantId: options.assistantId || this.assistantId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        call: response.data
      };

    } catch (error) {
      console.error('❌ Erreur réponse appel:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Refuser un appel entrant
  async declineCall(callId) {
    try {
      console.log('❌ Refus de l\'appel:', callId);

      const response = await axios.delete(`${this.baseURL}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        message: 'Appel refusé'
      };

    } catch (error) {
      console.error('❌ Erreur refus appel:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Vérifier le statut d'Emma
  async getStatus() {
    return {
      isListening: this.isListening,
      phoneNumberId: this.phoneNumberId,
      assistantId: this.assistantId
    };
  }
}

module.exports = new VapiService();
