const express = require('express');
const router = express.Router();
const vapiService = require('../services/vapiService');
const authMiddleware = require('../middleware/authMiddleware');

// Activer Emma pour les appels entrants
router.post('/activate', authMiddleware, async (req, res) => {
  try {
    const { assistantId, phoneNumberId, mode } = req.body;

    // Configuration pour activer la réception d'appels
    const activationResult = await vapiService.activateIncomingCalls({
      assistantId,
      phoneNumberId,
      webhookUrl: `${process.env.BASE_URL}/api/emma/webhook`
    });

    if (activationResult.success) {
      res.json({
        success: true,
        message: 'Emma activée pour les appels entrants',
        data: activationResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'activation d\'Emma',
        error: activationResult.error
      });
    }

  } catch (error) {
    console.error('Erreur activation Emma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'activation',
      error: error.message
    });
  }
});

// Désactiver Emma
router.post('/deactivate', authMiddleware, async (req, res) => {
  try {
    const deactivationResult = await vapiService.deactivateIncomingCalls();

    if (deactivationResult.success) {
      res.json({
        success: true,
        message: 'Emma désactivée'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la désactivation',
        error: deactivationResult.error
      });
    }

  } catch (error) {
    console.error('Erreur désactivation Emma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Webhook pour recevoir les appels entrants Vapi
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('📞 Webhook Emma reçu:', type, data?.id);

    // Émettre via Socket.IO pour notifier le frontend en temps réel
    const io = req.app.get('io');
    
    switch (type) {
      case 'call-start':
      case 'incoming_call':
        console.log('📞 Nouvel appel entrant:', data.id);
        if (io) {
          io.emit('incoming_call', {
            callId: data.id,
            callerNumber: data.customer?.number || 'Numéro masqué',
            callerName: data.customer?.name || data.metadata?.prospect_name || 'Appelant inconnu',
            timestamp: new Date(),
            callData: data
          });
        }
        break;
        
      case 'call-end':
        console.log('📞 Appel terminé:', data.id);
        if (io) {
          io.emit('call_ended', {
            callId: data.id,
            callData: data
          });
        }
        break;
        
      case 'call-update':
        console.log('📞 Mise à jour appel:', data.id);
        if (io) {
          io.emit('call_updated', {
            callId: data.id,
            callData: data
          });
        }
        break;
        
      default:
        console.log('📨 Événement non géré:', type);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erreur webhook Emma:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Vérifier les appels entrants (polling backup)
router.get('/incoming-calls', authMiddleware, async (req, res) => {
  try {
    const result = await vapiService.getIncomingCalls();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Répondre à un appel entrant
router.post('/answer-call/:callId', authMiddleware, async (req, res) => {
  try {
    const { callId } = req.params;
    const { assistantId, autoAnswer } = req.body;

    const result = await vapiService.answerCall(callId, {
      assistantId,
      autoAnswer
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Appel accepté',
        call: result.call
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la prise d\'appel',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Refuser un appel entrant
router.post('/decline-call/:callId', authMiddleware, async (req, res) => {
  try {
    const { callId } = req.params;
    const result = await vapiService.declineCall(callId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Appel refusé'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du refus',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

module.exports = router;
