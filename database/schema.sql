DROP DATABASE IF EXISTS mon_miam_miam;
CREATE DATABASE mon_miam_miam
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE mon_miam_miam;

-- =====================================================================
--  ÉTAPE 1 - Tables sans dépendance : restaurant
-- =====================================================================

CREATE TABLE restaurant (
    Id_restaurant       VARCHAR(5)   NOT NULL,
    nom_restaurant      VARCHAR(150) NOT NULL,
    adresse_restaurant  TEXT,
    telephone_restaurant VARCHAR(30),
    email_restaurant    VARCHAR(255),
    heure_ouverture     TIME         NOT NULL,
    heure_fermeture     TIME         NOT NULL,
    livraison_active    BOOLEAN      NOT NULL DEFAULT 1,
    date_creation       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut_restaurant   VARCHAR(20)  NOT NULL DEFAULT 'actif',
    PRIMARY KEY (Id_restaurant),
    CONSTRAINT chk_rest_id      CHECK (REGEXP_LIKE(Id_restaurant, '^[A-Z]{2}[0-9]{3}$', 'c')),
    CONSTRAINT chk_rest_statut  CHECK (statut_restaurant IN ('actif','inactif')),
    CONSTRAINT chk_rest_horaire CHECK (heure_fermeture > heure_ouverture)
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 2 - Utilisateurs et héritage (Utilisateur -> 4 sous-types)
-- =====================================================================

CREATE TABLE utilisateur (
    Id_utilisateur   VARCHAR(10)  NOT NULL,
    nom              VARCHAR(100) NOT NULL,
    prenom           VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    mot_de_passe     VARCHAR(255) NOT NULL,   -- HASH uniquement (bcrypt/argon2), jamais le mot de passe en clair
    date_inscription DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut_compte    VARCHAR(20)  NOT NULL DEFAULT 'actif',
    telephone        CHAR(9)      NOT NULL,
    PRIMARY KEY (Id_utilisateur),
    UNIQUE KEY uq_utilisateur_email (email),
    CONSTRAINT chk_user_id     CHECK (REGEXP_LIKE(Id_utilisateur, '^[A-Z]{4}[0-9]{6}$', 'c')),
    CONSTRAINT chk_user_email  CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_user_statut CHECK (statut_compte IN ('actif','inactif')),
    CONSTRAINT chk_user_tel    CHECK (telephone REGEXP '^6[0-9]{8}$')
    -- La règle "8 caractères, 1 majuscule, 1 chiffre" du mot de passe se contrôle dans
    -- l'application AVANT le hachage (impossible à vérifier sur un hash).
) ENGINE=InnoDB;

CREATE TABLE etudiant (
    Id_utilisateur  VARCHAR(10) NOT NULL,
    localisation    TEXT,
    code_parrainage VARCHAR(8)  NOT NULL,
    solde_point     INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (Id_utilisateur),
    UNIQUE KEY uq_etudiant_code_parrainage (code_parrainage),
    CONSTRAINT fk_etudiant_utilisateur FOREIGN KEY (Id_utilisateur)
        REFERENCES utilisateur (Id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT chk_etu_code  CHECK (REGEXP_LIKE(code_parrainage, '^[A-Z]{4}[0-9]{4}$', 'c')),
    CONSTRAINT chk_etu_solde CHECK (solde_point >= 0)
) ENGINE=InnoDB;

CREATE TABLE employe (
    Id_utilisateur      VARCHAR(10)  NOT NULL,
    poste               VARCHAR(100),
    date_embauche       DATE,
    Id_restaurant       VARCHAR(5)   NOT NULL,
    Id_createur         VARCHAR(10)  NULL,      -- gérant ou administrateur ayant créé le compte (association Embaucher)
    date_creation_compte DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Id_utilisateur),
    CONSTRAINT fk_employe_utilisateur FOREIGN KEY (Id_utilisateur)
        REFERENCES utilisateur (Id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_employe_restaurant FOREIGN KEY (Id_restaurant)
        REFERENCES restaurant (Id_restaurant),
    CONSTRAINT fk_employe_createur FOREIGN KEY (Id_createur)
        REFERENCES utilisateur (Id_utilisateur)
) ENGINE=InnoDB;

CREATE TABLE gerant (
    Id_utilisateur  VARCHAR(10) NOT NULL,
    date_nomination DATE,
    Id_restaurant   VARCHAR(5)  NOT NULL,
    PRIMARY KEY (Id_utilisateur),
    CONSTRAINT fk_gerant_utilisateur FOREIGN KEY (Id_utilisateur)
        REFERENCES utilisateur (Id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_gerant_restaurant FOREIGN KEY (Id_restaurant)
        REFERENCES restaurant (Id_restaurant)
) ENGINE=InnoDB;

CREATE TABLE administrateur (
    Id_utilisateur  VARCHAR(10) NOT NULL,
    date_nomination DATE,
    Id_restaurant   VARCHAR(5)  NULL,           -- NULL = administrateur global (tous restaurants)
    PRIMARY KEY (Id_utilisateur),
    CONSTRAINT fk_admin_utilisateur FOREIGN KEY (Id_utilisateur)
        REFERENCES utilisateur (Id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_admin_restaurant FOREIGN KEY (Id_restaurant)
        REFERENCES restaurant (Id_restaurant)
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 3 - Menu
-- =====================================================================

CREATE TABLE article_menu (
    Id_article            VARCHAR(6)   NOT NULL,
    nom_article           VARCHAR(150) NOT NULL,
    description           TEXT,
    image_article         VARCHAR(255),           -- chemin ou URL de la photo (facultatif)
    prix_article          BIGINT       NOT NULL,
    categories_article    VARCHAR(255) NOT NULL,
    disponibilite_article BOOLEAN      NOT NULL DEFAULT 1,
    Menu_du_jour          BOOLEAN      NOT NULL DEFAULT 0,
    Id_restaurant         VARCHAR(5)   NOT NULL,
    PRIMARY KEY (Id_article),
    CONSTRAINT fk_article_restaurant FOREIGN KEY (Id_restaurant)
        REFERENCES restaurant (Id_restaurant),
    CONSTRAINT chk_art_id   CHECK (REGEXP_LIKE(Id_article, '^[A-Z]{3}[0-9]{3}$', 'c')),
    CONSTRAINT chk_art_prix CHECK (prix_article >= 0),
    CONSTRAINT chk_art_cat  CHECK (categories_article IN ('plat','boisson','dessert','accompagnement','autre'))
    -- categories_article : valeur simple pour l'instant (simple ou multiple à confirmer)
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 4 - Commandes
-- =====================================================================

CREATE TABLE commande (
    Id_commande           VARCHAR(8)  NOT NULL,
    date_commande         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    montant_total         BIGINT      NOT NULL DEFAULT 0,
    mode_service          VARCHAR(20) NOT NULL,
    statut_commande       VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    points_utilises       INT         NOT NULL DEFAULT 0,
    reduction_points      BIGINT      NOT NULL DEFAULT 0,
    commentaire           TEXT,
    heure_recup           TIME        NULL,
    Id_utilisateur        VARCHAR(10) NOT NULL,   -- étudiant qui commande (Passer)
    Id_restaurant         VARCHAR(5)  NOT NULL,   -- Recevoir
    Id_valideur           VARCHAR(10) NULL,       -- employé validateur (Valider)
    date_validation       DATETIME    NULL,
    Id_admin_valideur     VARCHAR(10) NULL,       -- Valider_admin
    date_validation_admin DATETIME    NULL,
    PRIMARY KEY (Id_commande),
    CONSTRAINT fk_cmd_etudiant   FOREIGN KEY (Id_utilisateur)    REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT fk_cmd_restaurant FOREIGN KEY (Id_restaurant)     REFERENCES restaurant (Id_restaurant),
    CONSTRAINT fk_cmd_valideur   FOREIGN KEY (Id_valideur)       REFERENCES employe (Id_utilisateur),
    CONSTRAINT fk_cmd_admin      FOREIGN KEY (Id_admin_valideur) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT chk_cmd_id      CHECK (REGEXP_LIKE(Id_commande, '^#COM[0-9]{4}$', 'c')),
    CONSTRAINT chk_cmd_montant CHECK (montant_total >= 0),
    CONSTRAINT chk_cmd_mode    CHECK (mode_service IN ('sur_place','livraison')),
    CONSTRAINT chk_cmd_statut  CHECK (statut_commande IN
        ('en_attente','validee','en_preparation','prete','en_livraison','servie','annulee')),
    CONSTRAINT chk_cmd_points  CHECK (points_utilises >= 0),
    CONSTRAINT chk_cmd_reduc   CHECK (reduction_points >= 0),
    CONSTRAINT chk_cmd_recup   CHECK (mode_service <> 'sur_place' OR heure_recup IS NOT NULL)
) ENGINE=InnoDB;

-- Lignes de commande (association Contenir : commande <-> article)
CREATE TABLE contenir (
    Id_commande   VARCHAR(8) NOT NULL,
    Id_article    VARCHAR(6) NOT NULL,
    quantite      INT        NOT NULL,
    prix_unitaire BIGINT     NOT NULL,      -- prix au moment de la commande (historique)
    PRIMARY KEY (Id_commande, Id_article),
    CONSTRAINT fk_contenir_commande FOREIGN KEY (Id_commande) REFERENCES commande (Id_commande),
    CONSTRAINT fk_contenir_article  FOREIGN KEY (Id_article)  REFERENCES article_menu (Id_article),
    CONSTRAINT chk_contenir_qte  CHECK (quantite > 0),
    CONSTRAINT chk_contenir_prix CHECK (prix_unitaire >= 0)
) ENGINE=InnoDB;

CREATE TABLE historique_statut (
    Id_historique   VARCHAR(8)  NOT NULL,
    nouveau_statut  VARCHAR(30) NOT NULL,
    date_changement DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Id_commande     VARCHAR(8)  NOT NULL,
    Id_utilisateur  VARCHAR(10) NOT NULL,   -- employé, gérant ou administrateur
    PRIMARY KEY (Id_historique),
    CONSTRAINT fk_hist_commande FOREIGN KEY (Id_commande)    REFERENCES commande (Id_commande),
    CONSTRAINT fk_hist_user     FOREIGN KEY (Id_utilisateur) REFERENCES utilisateur (Id_utilisateur),
    CONSTRAINT chk_hist_id     CHECK (REGEXP_LIKE(Id_historique, '^[A-Z]{3}[0-9]{5}$', 'c')),
    CONSTRAINT chk_hist_statut CHECK (nouveau_statut IN
        ('en_attente','validee','en_preparation','prete','en_livraison','servie','annulee'))
) ENGINE=InnoDB;

CREATE TABLE livraison (
    Id_livraison      VARCHAR(7)  NOT NULL,
    adresse_livraison TEXT        NOT NULL,
    frais_livraison   BIGINT      NOT NULL DEFAULT 0,
    statut_livraison  VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    date_prevue       DATETIME    NULL,
    date_livraison    DATETIME    NULL,
    Id_commande       VARCHAR(8)  NOT NULL,   -- Donner_lieu (1 livraison max par commande)
    Id_utilisateur    VARCHAR(10) NULL,       -- livreur (Livrer)
    PRIMARY KEY (Id_livraison),
    UNIQUE KEY uq_livraison_commande (Id_commande),
    CONSTRAINT fk_liv_commande FOREIGN KEY (Id_commande)    REFERENCES commande (Id_commande),
    CONSTRAINT fk_liv_livreur  FOREIGN KEY (Id_utilisateur) REFERENCES employe (Id_utilisateur),
    CONSTRAINT chk_liv_id     CHECK (REGEXP_LIKE(Id_livraison, '^[A-Z]{3}[0-9]{4}$', 'c')),
    CONSTRAINT chk_liv_frais  CHECK (frais_livraison >= 0),
    CONSTRAINT chk_liv_statut CHECK (statut_livraison IN
        ('en_attente','assignee','en_cours','livree','echouee'))
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 5 - Paiement, fidélité, parrainage
-- =====================================================================

CREATE TABLE paiement (
    Id_paiement           VARCHAR(6)   NOT NULL,
    montant_paye          BIGINT       NOT NULL,
    mode_paiement         VARCHAR(10)  NOT NULL,
    date_paiement         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut_paiement       VARCHAR(30)  NOT NULL DEFAULT 'en_cours_validation',
    reference_transaction VARCHAR(150) NULL,   -- référence retournée par l'agrégateur
    Id_commande           VARCHAR(8)   NOT NULL,
    PRIMARY KEY (Id_paiement),
    UNIQUE KEY uq_paiement_reference (reference_transaction),
    CONSTRAINT fk_paiement_commande FOREIGN KEY (Id_commande) REFERENCES commande (Id_commande),
    CONSTRAINT chk_pai_id      CHECK (REGEXP_LIKE(Id_paiement, '^[A-Z]{2}[0-9]{4}$', 'c')),
    CONSTRAINT chk_pai_montant CHECK (montant_paye >= 0),
    CONSTRAINT chk_pai_mode    CHECK (mode_paiement IN ('MOMO','OM','CARTE')),
    CONSTRAINT chk_pai_statut  CHECK (statut_paiement IN
        ('paye','en_cours_validation','annule','echoue','rembourse'))
) ENGINE=InnoDB;

CREATE TABLE mvt_points (
    Id_mvt          VARCHAR(5)  NOT NULL,
    date_mvt        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nbres_points    INT         NOT NULL,   -- convention de signe à confirmer avec type_mvt
    type_mvt        VARCHAR(30) NOT NULL,
    date_expiration DATETIME    NULL,       -- date_mvt + 12 mois (durée paramétrable)
    Id_utilisateur  VARCHAR(10) NOT NULL,   -- étudiant concerné (Obtenir_points)
    Id_commande     VARCHAR(8)  NULL,       -- Generer
    PRIMARY KEY (Id_mvt),
    CONSTRAINT fk_mvt_etudiant FOREIGN KEY (Id_utilisateur) REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT fk_mvt_commande FOREIGN KEY (Id_commande)    REFERENCES commande (Id_commande),
    CONSTRAINT chk_mvt_id   CHECK (REGEXP_LIKE(Id_mvt, '^[A-Z]{2}[0-9]{3}$', 'c')),
    CONSTRAINT chk_mvt_type CHECK (type_mvt IN ('gain','utilisation','expiration','parrainage','jeu'))
) ENGINE=InnoDB;

-- Association Parrainer : un filleul n'a qu'un seul parrain (clé primaire = Id_filleul)
CREATE TABLE parrainer (
    Id_filleul           VARCHAR(10) NOT NULL,
    Id_parrain           VARCHAR(10) NOT NULL,
    date_parrainage      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recompense_attribuee BOOLEAN     NOT NULL DEFAULT 0,
    PRIMARY KEY (Id_filleul),
    CONSTRAINT fk_parr_filleul FOREIGN KEY (Id_filleul) REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT fk_parr_parrain FOREIGN KEY (Id_parrain) REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT chk_parr_distinct CHECK (Id_parrain <> Id_filleul)
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 6 - Réclamations
--  (les liens Traiter / Gestion_reclamation / *_admin sont portés par des
--   colonnes de reclamation, conformément à la section 11 du dictionnaire)
-- =====================================================================

CREATE TABLE reclamation (
    Id_reclamation          VARCHAR(10)  NOT NULL,
    date_reclamation        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motif_reclamation       VARCHAR(255) NOT NULL,
    description_reclamation TEXT,
    statut_reclamation      VARCHAR(20)  NOT NULL DEFAULT 'en_attente',
    reponse_reclamation     TEXT,
    Id_utilisateur          VARCHAR(10)  NOT NULL,   -- étudiant (Deposer)
    Id_commande             VARCHAR(8)   NOT NULL,   -- Concerner
    Id_traitant             VARCHAR(10)  NULL,       -- employé (Traiter)
    date_traitement         DATETIME     NULL,
    Id_gerant               VARCHAR(10)  NULL,       -- Gestion_reclamation
    date_decision           DATETIME     NULL,
    decision                VARCHAR(50)  NULL,
    Id_admin_traitant       VARCHAR(10)  NULL,       -- Traiter_admin
    date_traitement_admin   DATETIME     NULL,
    Id_admin_decideur       VARCHAR(10)  NULL,       -- Gestion_reclamation_admin
    date_decision_admin     DATETIME     NULL,
    decision_admin          VARCHAR(50)  NULL,
    PRIMARY KEY (Id_reclamation),
    CONSTRAINT fk_recl_etudiant  FOREIGN KEY (Id_utilisateur)    REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT fk_recl_commande  FOREIGN KEY (Id_commande)       REFERENCES commande (Id_commande),
    CONSTRAINT fk_recl_traitant  FOREIGN KEY (Id_traitant)       REFERENCES employe (Id_utilisateur),
    CONSTRAINT fk_recl_gerant    FOREIGN KEY (Id_gerant)         REFERENCES gerant (Id_utilisateur),
    CONSTRAINT fk_recl_adm_trait FOREIGN KEY (Id_admin_traitant) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT fk_recl_adm_decid FOREIGN KEY (Id_admin_decideur) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT chk_recl_id     CHECK (REGEXP_LIKE(Id_reclamation, '^#RECLA[0-9]{4}$', 'c')),
    CONSTRAINT chk_recl_statut CHECK (statut_reclamation IN ('en_attente','observation','validee','rejetee'))
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 7 - Événements, mini-jeux, paramètres, cookies, mot de passe
-- =====================================================================

CREATE TABLE evenement (
    Id_evenement          VARCHAR(7)  NOT NULL,
    affiche_evenement     TEXT,                  -- chemin ou URL de l'affiche
    debut_evenement       DATETIME    NOT NULL,
    fin_evenement         DATETIME    NOT NULL,
    type_evenement        VARCHAR(20) NOT NULL,
    points_evenement      INT           NOT NULL DEFAULT 0,  -- points gagnes a la participation
    taux_reduction        TINYINT UNSIGNED NULL,             -- reduction en % pour une promotion
    description_evenement TEXT,
    Id_utilisateur        VARCHAR(10) NOT NULL,  -- administrateur créateur (Creer)
    PRIMARY KEY (Id_evenement),
    CONSTRAINT fk_evt_admin FOREIGN KEY (Id_utilisateur) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT chk_evt_id      CHECK (REGEXP_LIKE(Id_evenement, '^[A-Z]{3}[0-9]{4}$', 'c')),
    CONSTRAINT chk_evt_periode CHECK (fin_evenement >= debut_evenement),
    CONSTRAINT chk_evt_type    CHECK (type_evenement IN ('promotion','evenement','mini_jeu'))
) ENGINE=InnoDB;

CREATE TABLE participation_evenement (
    Id_utilisateur     VARCHAR(10) NOT NULL,
    Id_evenement       VARCHAR(7)  NOT NULL,
    date_participation DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    points_gagnes      INT         NOT NULL DEFAULT 0,
    prix_gagne         VARCHAR(150) NULL,
    Id_mvt             VARCHAR(5)  NULL,         -- mouvement de points généré (Crediter)
    PRIMARY KEY (Id_utilisateur, Id_evenement, date_participation),
    CONSTRAINT fk_part_etudiant  FOREIGN KEY (Id_utilisateur) REFERENCES etudiant (Id_utilisateur),
    CONSTRAINT fk_part_evenement FOREIGN KEY (Id_evenement)   REFERENCES evenement (Id_evenement),
    CONSTRAINT fk_part_mvt       FOREIGN KEY (Id_mvt)         REFERENCES mvt_points (Id_mvt),
    CONSTRAINT chk_part_points CHECK (points_gagnes >= 0)
) ENGINE=InnoDB;

CREATE TABLE parametre (
    Id_parametre   VARCHAR(5)   NOT NULL,
    cle            VARCHAR(100) NOT NULL,
    valeur         TEXT         NOT NULL,
    Id_utilisateur VARCHAR(10)  NULL,            -- dernier administrateur modificateur (Modifier)
    PRIMARY KEY (Id_parametre),
    UNIQUE KEY uq_parametre_cle (cle),
    CONSTRAINT fk_param_admin FOREIGN KEY (Id_utilisateur) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT chk_param_id CHECK (REGEXP_LIKE(Id_parametre, '^[A-Z]{2}[0-9]{3}$', 'c'))
) ENGINE=InnoDB;

CREATE TABLE cookies (
    Id_cookies        VARCHAR(8)  NOT NULL,
    date_cookies      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    choix_cookies     VARCHAR(20) NOT NULL,
    version_politique VARCHAR(30) NOT NULL,
    Id_utilisateur    VARCHAR(10) NULL,          -- NULL = visiteur non connecté (Donner)
    PRIMARY KEY (Id_cookies),
    CONSTRAINT fk_cookies_user FOREIGN KEY (Id_utilisateur) REFERENCES utilisateur (Id_utilisateur),
    CONSTRAINT chk_cookies_id    CHECK (REGEXP_LIKE(Id_cookies, '^[A-Z]{3}[0-9]{5}$', 'c')),
    CONSTRAINT chk_cookies_choix CHECK (choix_cookies IN ('accepte','refuse','personnalise'))
) ENGINE=InnoDB;

CREATE TABLE reinitialisation_mdp (
    Id_reset        VARCHAR(8)   NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,       -- hash du jeton, jamais le jeton en clair
    date_demande    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_expiration DATETIME     NOT NULL,
    utilise         BOOLEAN      NOT NULL DEFAULT 0,
    Id_utilisateur  VARCHAR(10)  NOT NULL,       -- Demander_reinitialisation
    PRIMARY KEY (Id_reset),
    CONSTRAINT fk_reset_user FOREIGN KEY (Id_utilisateur) REFERENCES utilisateur (Id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT chk_reset_id CHECK (REGEXP_LIKE(Id_reset, '^[A-Z]{3}[0-9]{5}$', 'c'))
) ENGINE=InnoDB;

-- =====================================================================
--  ÉTAPE 8 - Gestion du menu (tables d'associations avec historique)
-- =====================================================================

CREATE TABLE mise_a_jour_menu (          -- employé -> article
    Id_utilisateur      VARCHAR(10) NOT NULL,
    Id_article          VARCHAR(6)  NOT NULL,
    date_modification   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nature_modification VARCHAR(255),
    PRIMARY KEY (Id_utilisateur, Id_article, date_modification),
    CONSTRAINT fk_maj_employe FOREIGN KEY (Id_utilisateur) REFERENCES employe (Id_utilisateur),
    CONSTRAINT fk_maj_article FOREIGN KEY (Id_article)     REFERENCES article_menu (Id_article)
) ENGINE=InnoDB;

CREATE TABLE gestion_menu_admin (        -- administrateur -> article
    Id_utilisateur      VARCHAR(10) NOT NULL,
    Id_article          VARCHAR(6)  NOT NULL,
    date_modification   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nature_modification VARCHAR(255),
    PRIMARY KEY (Id_utilisateur, Id_article, date_modification),
    CONSTRAINT fk_gma_admin   FOREIGN KEY (Id_utilisateur) REFERENCES administrateur (Id_utilisateur),
    CONSTRAINT fk_gma_article FOREIGN KEY (Id_article)     REFERENCES article_menu (Id_article)
) ENGINE=InnoDB;
