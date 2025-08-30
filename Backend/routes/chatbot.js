// routes/chatbot.js

// Base de données des agents avec informations complètes
const agents = {
  julia: {
    id: 'julia',
    name: 'Julia',
    speciality: 'Communication et SMS',
    icon: '📞',
    color: 'blue',
    welcomeMessage: 'Bonjour ! Je suis Julia, votre assistante pour la communication. Comment puis-je vous aider avec vos SMS ou e-mails ?',
    capabilities: ['Envoi SMS personnalisés', 'Gestion des e-mails', 'Délégation de tâches'],
    keywords: ['sms', 'message', 'communication', 'email', 'mail', 'envoyer', 'correspondance', 'contact']
  },
  emilie: {
    id: 'emilie',
    name: 'Émilie', 
    speciality: 'Rédaction médicale',
    icon: '📝',
    color: 'rose',
    welcomeMessage: 'Salut ! Émilie à votre service pour la rédaction. Souhaitez-vous créer un courrier médical ou personnaliser vos modèles ?',
    capabilities: ['Courriers médicaux', 'Modèles personnalisés', 'Carnet d\'adresses'],
    keywords: ['courrier', 'lettre', 'rédaction', 'écrire', 'modèle', 'document', 'carnet', 'adresse']
  },
  tom: {
    id: 'tom',
    name: 'Tom',
    speciality: 'Gestion financière', 
    icon: '💰',
    color: 'green',
    welcomeMessage: 'Hello ! Tom ici pour vos analyses financières. Voulez-vous consulter la trésorerie ou générer des rapports ?',
    capabilities: ['Analyse de trésorerie', 'Synthèses financières', 'Rapports automatisés'],
    keywords: ['argent', 'finance', 'trésorerie', 'rapport', 'budget', 'comptabilité', 'analyse', 'synthèse']
  },
  emma: {
    id: 'emma',
    name: 'Emma',
    speciality: 'Réception virtuelle',
    icon: '🎧',
    color: 'orange',
    welcomeMessage: 'Bonjour ! Emma pour la réception. Je peux gérer vos appels et identifier vos patients. Que puis-je faire ?',
    capabilities: ['Appels téléphoniques', 'Identification patients', 'Transmission d\'informations'],
    keywords: ['appel', 'téléphone', 'réception', 'accueil', 'identifier', 'patient', 'transmission']
  },
  nora: {
    id: 'nora',
    name: 'Nora',
    speciality: 'Conseils patients',
    icon: '📱',
    color: 'purple',
    welcomeMessage: 'Salut ! Nora pour les conseils patients. Voulez-vous créer des conseils personnalisés ou programmer des rappels ?',
    capabilities: ['Conseils personnalisés', 'Application patient', 'Rappels de rendez-vous'],
    keywords: ['conseil', 'patient', 'rdv', 'rendez-vous', 'rappel', 'suivi', 'personnalisé', 'app']
  }
};

// Messages pré-définis pour différentes situations
const predefinedResponses = {
  welcome: '👋 Bonjour ! Je suis votre guide intelligent Dentalteam.fr. Décrivez-moi votre besoin et je vous orienterai vers le bon agent spécialisé !',
  noMatch: 'Je peux vous guider vers le bon agent ! Dites-moi ce que vous souhaitez faire :\n• Communication (SMS, e-mails)\n• Rédaction (courriers médicaux)\n• Finance (trésorerie, rapports)\n• Réception (appels, patients)\n• Conseils patients (RDV, suivi)',
  multipleMatch: 'J\'ai trouvé plusieurs agents qui pourraient vous aider. Pouvez-vous être plus précis sur votre besoin ?',
  error: 'Désolé, j\'ai rencontré un problème. Pouvez-vous reformuler votre demande ?'
};

// Logique d'analyse intelligente des messages
const getGuidanceResponse = (userMessage, context = {}) => {
  try {
    // Validation d'entrée améliorée
    if (!userMessage || typeof userMessage !== 'string') {
      return {
        response: predefinedResponses.noMatch,
        suggestedAgent: null,
        confidence: 0,
        nextActions: ['Voir tous les agents', 'Expliquer mon besoin']
      };
    }

    const message = userMessage.toLowerCase().trim();
    
    // Vérification de message vide
    if (!message) {
      return {
        response: predefinedResponses.noMatch,
        suggestedAgent: null,
        confidence: 0,
        nextActions: ['Voir tous les agents', 'Expliquer mon besoin']
      };
    }

    // Calcul des scores pour chaque agent
    const scores = {};
    let maxScore = 0;
    let bestAgent = null;

    Object.keys(agents).forEach(agentId => {
      const agent = agents[agentId];
      let score = 0;

      // Vérification des mots-clés avec protection
      if (agent.keywords && Array.isArray(agent.keywords)) {
        agent.keywords.forEach(keyword => {
          if (keyword && typeof keyword === 'string') {
            if (message.includes(keyword.toLowerCase())) {
              score += 10; // Score élevé pour correspondance exacte
            }
            // Correspondance partielle (minimum 3 caractères)
            if (keyword.length >= 3 && message.includes(keyword.substring(0, 3).toLowerCase())) {
              score += 3;
            }
          }
        });
      }

      // Bonus pour mentions du nom de l'agent
      if (agent.name && message.includes(agent.name.toLowerCase())) {
        score += 15;
      }

      // Bonus pour spécialité mentionnée
      if (agent.speciality && message.includes(agent.speciality.toLowerCase())) {
        score += 12;
      }

      scores[agentId] = score;
      
      if (score > maxScore) {
        maxScore = score;
        bestAgent = agentId;
      }
    });

    // Détermination de la réponse basée sur le score
    if (maxScore >= 8 && bestAgent) {
      const agent = agents[bestAgent];
      const capabilityList = agent.capabilities && Array.isArray(agent.capabilities) 
        ? agent.capabilities.map(cap => `• ${cap}`).join('\n')
        : '• Fonctionnalités spécialisées disponibles';

      return {
        response: `Parfait ! ${agent.name} est exactement ce qu'il vous faut pour ${agent.speciality.toLowerCase()}. ${agent.name === 'Tom' ? 'Il' : 'Elle'} peut vous aider avec :\n${capabilityList}`,
        suggestedAgent: bestAgent,
        confidence: Math.min(maxScore / 15, 1), // Normalisation entre 0 et 1
        nextActions: [`Consulter ${agent.name}`, 'Voir d\'autres options', 'Poser une question']
      };
    } else if (maxScore >= 3) {
      return {
        response: predefinedResponses.multipleMatch,
        suggestedAgent: null,
        confidence: 0.5,
        nextActions: ['Être plus précis', 'Voir tous les agents', 'Reformuler']
      };
    } else {
      return {
        response: predefinedResponses.noMatch,
        suggestedAgent: null,
        confidence: 0,
        nextActions: ['Voir tous les agents', 'Expliquer mon besoin', 'Exemples d\'usage']
      };
    }

  } catch (error) {
    console.error('Erreur dans getGuidanceResponse:', error);
    return {
      response: predefinedResponses.error,
      suggestedAgent: null,
      confidence: 0,
      nextActions: ['Réessayer', 'Contacter le support']
    };
  }
};

// Fonction pour obtenir des exemples d'usage
const getUsageExamples = () => {
  try {
    return {
      examples: [
        'Je veux envoyer un SMS à mes patients',
        'J\'ai besoin de rédiger un courrier médical',
        'Analyser la trésorerie de mon cabinet',
        'Gérer les appels de la réception',
        'Créer des conseils pour mes patients'
      ],
      categories: Object.keys(agents).map(id => ({
        id,
        name: agents[id].name,
        description: agents[id].speciality,
        example: `Que peut faire ${agents[id].name} ?`
      }))
    };
  } catch (error) {
    console.error('Erreur dans getUsageExamples:', error);
    return {
      examples: [],
      categories: []
    };
  }
};

// Fonction pour obtenir l'aide contextuelle
const getContextualHelp = (userMessage) => {
  try {
    const helpTopics = {
      'comment': 'Décrivez simplement ce que vous voulez faire, par exemple "envoyer un SMS" ou "rédiger un courrier"',
      'aide': 'Je peux vous guider vers 5 agents spécialisés. Dites-moi votre besoin et je vous orienterai !',
      'qui': 'Nos agents sont : Julia (Communication), Émilie (Rédaction), Tom (Finance), Emma (Réception), Nora (Conseils patients)',
      'quoi': 'Chaque agent a des spécialités différentes. Quel type de tâche souhaitez-vous accomplir ?'
    };

    if (!userMessage || typeof userMessage !== 'string') {
      return null;
    }

    const message = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(helpTopics)) {
      if (message.includes(keyword)) {
        return response;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur dans getContextualHelp:', error);
    return null;
  }
};

// Export du module principal pour Socket.IO
module.exports = (io) => {
  // Validation de l'objet io
  if (!io) {
    console.error('❌ Objet Socket.IO non fourni au module chatbot');
    return;
  }

  // Stockage des sessions utilisateur
  const userSessions = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté: ${socket.id}`);
    
    // Initialisation de la session utilisateur
    userSessions.set(socket.id, {
      startTime: new Date(),
      messageCount: 0,
      lastAgent: null,
      context: {}
    });

    // Message de bienvenue personnalisé
    setTimeout(() => {
      socket.emit('bot_message', {
        type: 'welcome',
        content: predefinedResponses.welcome,
        timestamp: new Date(),
        sessionId: socket.id
      });
    }, 500);

    // Gestion des messages utilisateur
    socket.on('user_message', (data) => {
      try {
        const session = userSessions.get(socket.id);
        if (session) {
          session.messageCount++;
          session.lastMessage = data?.message || '';
        }

        console.log(`💬 Message de ${socket.id}:`, data?.message || 'Message vide');

        // Validation des données reçues
        if (!data || !data.message) {
          socket.emit('bot_message', {
            type: 'error',
            content: 'Message vide reçu. Pouvez-vous reformuler votre demande ?',
            timestamp: new Date()
          });
          return;
        }

        // Vérification d'aide contextuelle
        const help = getContextualHelp(data.message);
        if (help) {
          socket.emit('bot_message', {
            type: 'help',
            content: help,
            timestamp: new Date()
          });
          return;
        }

        // Analyse du message avec contexte de session
        const guidance = getGuidanceResponse(data.message, {
          ...data.context,
          session: session
        });

        // Réponse avec délai réaliste pour simuler la réflexion
        setTimeout(() => {
          socket.emit('bot_message', {
            type: 'guidance',
            content: guidance.response,
            suggestedAgent: guidance.suggestedAgent,
            confidence: guidance.confidence,
            nextActions: guidance.nextActions,
            timestamp: new Date()
          });

          // Si un agent est suggéré avec haute confidence
          if (guidance.suggestedAgent && guidance.confidence > 0.6) {
            setTimeout(() => {
              const agent = agents[guidance.suggestedAgent];
              if (agent && session) {
                session.lastAgent = guidance.suggestedAgent;
                
                socket.emit('agent_suggestion', {
                  agent: guidance.suggestedAgent,
                  name: agent.name,
                  speciality: agent.speciality,
                  icon: agent.icon,
                  color: agent.color,
                  capabilities: agent.capabilities,
                  welcomeMessage: agent.welcomeMessage,
                  confidence: guidance.confidence
                });
              }
            }, 1200);
          }
        }, 600);

      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
        socket.emit('bot_message', {
          type: 'error',
          content: predefinedResponses.error,
          timestamp: new Date()
        });
      }
    });

    // Demande d'informations sur un agent spécifique
    socket.on('get_agent_info', (agentId) => {
      try {
        const agent = agents[agentId];
        if (agent) {
          socket.emit('agent_info', {
            success: true,
            agent: agentId,
            ...agent
          });
        } else {
          socket.emit('agent_info', {
            success: false,
            message: 'Agent non trouvé'
          });
        }
      } catch (error) {
        console.error('Erreur get_agent_info:', error);
        socket.emit('agent_info', {
          success: false,
          message: 'Erreur lors de la récupération des informations'
        });
      }
    });

    // Demande d'exemples d'usage
    socket.on('get_usage_examples', () => {
      try {
        const examples = getUsageExamples();
        socket.emit('usage_examples', examples);
      } catch (error) {
        console.error('Erreur get_usage_examples:', error);
        socket.emit('usage_examples', {
          examples: [],
          categories: []
        });
      }
    });

    // Demande de la liste complète des agents
    socket.on('get_all_agents', () => {
      try {
        socket.emit('all_agents', {
          agents: Object.keys(agents).map(id => ({
            id,
            name: agents[id].name,
            speciality: agents[id].speciality,
            icon: agents[id].icon,
            color: agents[id].color
          }))
        });
      } catch (error) {
        console.error('Erreur get_all_agents:', error);
        socket.emit('all_agents', {
          agents: []
        });
      }
    });

    // Réinitialisation de la conversation
    socket.on('reset_conversation', () => {
      try {
        const session = userSessions.get(socket.id);
        if (session) {
          session.messageCount = 0;
          session.lastAgent = null;
          session.context = {};
        }
        
        socket.emit('bot_message', {
          type: 'reset',
          content: 'Conversation réinitialisée ! ' + predefinedResponses.welcome,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Erreur reset_conversation:', error);
      }
    });

    // Feedback utilisateur
    socket.on('user_feedback', (data) => {
      try {
        console.log(`👍 Feedback de ${socket.id}:`, data);
        socket.emit('feedback_received', {
          message: 'Merci pour votre retour ! Cela nous aide à améliorer le service.'
        });
      } catch (error) {
        console.error('Erreur user_feedback:', error);
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      try {
        const session = userSessions.get(socket.id);
        if (session) {
          console.log(`👋 Utilisateur ${socket.id} déconnecté après ${session.messageCount} messages`);
          userSessions.delete(socket.id);
        }
      } catch (error) {
        console.error('Erreur disconnect:', error);
      }
    });

    // Gestion des erreurs Socket.IO
    socket.on('error', (error) => {
      console.error(`❌ Erreur Socket.IO pour ${socket.id}:`, error);
    });
  });

  // Nettoyage périodique des sessions inactives
  const cleanupInterval = setInterval(() => {
    try {
      const now = new Date();
      userSessions.forEach((session, socketId) => {
        const timeDiff = now - session.startTime;
        if (timeDiff > 30 * 60 * 1000) { // 30 minutes
          userSessions.delete(socketId);
          console.log(`🧹 Session ${socketId} nettoyée (inactive)`);
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  }, 10 * 60 * 1000); // Vérification toutes les 10 minutes

  // Nettoyage lors de l'arrêt du serveur
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
  });

  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
  });
};

// Export des fonctions utilitaires pour tests ou usage externe
module.exports.utils = {
  agents,
  getGuidanceResponse,
  getUsageExamples,
  getContextualHelp
};
