## Niveau 0 — Compréhension de la position

Objectif : vérifier que le LLM sait lire et manipuler un échiquier.

Exemples de questions :

« Quelle est la position de chaque pièce ? »
« À qui est le tour ? »
« Le roi blanc est-il en échec ? »
« Quelle case est contrôlée par le cavalier f3 ? »
« Combien de pièces chaque joueur possède-t-il ? »
« Quelle est la différence de matériel ? »
« Donne-moi les coups légaux disponibles pour les blancs. »

Tools potentiels :
get_board_state, get_legal_moves, is_check, material_count.

## Niveau 1 — Tactiques immédiates

Objectif : trouver une réponse correcte à très court terme.

Questions :

« Y a-t-il un mat en un ? »
« Les blancs peuvent-ils gagner une pièce immédiatement ? »
« Quel est le meilleur coup tactique ici ? »
« Y a-t-il une fourchette ? »
« Y a-t-il un clouage ? »
« Cette combinaison fonctionne-t-elle ? »
« Après 1.Qh7+, quelles sont les réponses légales des noirs ? »

Tools potentiels :
analyze_position, generate_moves, evaluate_move, éventuellement un moteur.

## Niveau 2 — Calcul de variantes

On demande maintenant au LLM de projeter plusieurs coups dans le futur.

Questions :

« Que se passe-t-il après 3...Nxd4 ? »
« Donne la meilleure variante sur 3 coups. »
« Si je joue ce coup, quelle est la meilleure réponse adverse ? »
« Cette combinaison gagne-t-elle réellement du matériel ? »
« Quelle est la différence entre ces deux variantes ? »
« Trouve une séquence permettant de gagner le pion e5. »

Ici apparaît une compétence essentielle : choisir un coup → simuler → observer → réévaluer → continuer.

Tools :
make_move, undo_move, analyze_position, evaluate_position.

## Niveau 3 — Évaluation positionnelle

Le LLM doit maintenant répondre non seulement à « quel coup ? », mais à « pourquoi cette position est-elle bonne ou mauvaise ? »

Questions :

« Qui est mieux ici ? »
« Pourquoi les blancs ont-ils l'avantage ? »
« Quelle pièce est la moins bien placée ? »
« Quel est le plan des blancs ? »
« Quelle faiblesse stratégique possède cette position ? »
« Faut-il échanger les dames ? »
« Cette structure de pions est-elle favorable ? »
« Qui contrôle mieux le centre ? »

On introduit des tools comme :

evaluate_position, detect_pawn_structure, analyze_king_safety, piece_activity.

## Niveau 4 — Reconnaissance de plans

Ici, on quitte le tactique immédiat pour aller vers le raisonnement stratégique.

Questions :

« Quel devrait être le plan des blancs pour les 5 prochains coups ? »
« Comment exploiter la faiblesse du pion isolé ? »
« Où les blancs devraient-ils améliorer leurs pièces ? »
« Faut-il attaquer à l'aile roi ou à l'aile dame ? »
« Quel échange serait favorable ? »
« Quelle rupture de pions faut-il préparer ? »

Le LLM commence à construire une chaîne :

position → diagnostic → objectif → plan → coups candidats.

## Niveau 5 — Analyse d'une partie

On donne cette fois l'historique complet.

Questions :

« À quel moment les blancs ont-ils commencé à perdre l'avantage ? »
« Quel a été le premier vrai tournant de la partie ? »
« Quelle erreur tactique a été commise ? »
« Pourquoi ce coup était-il mauvais ? »
« Quelle aurait été la meilleure continuation ? »
« Compare la partie réelle avec la meilleure ligne possible. »

Tools :
get_game_history, analyze_move, evaluate_position, moteur d'échecs.

## Niveau 6 — Recherche dans une base de parties

Le LLM doit maintenant utiliser des connaissances externes à la position actuelle.

Questions :

« Cette position apparaît-elle dans des parties célèbres ? »
« Comment les grands maîtres jouent-ils cette position ? »
« Quel coup est le plus fréquent dans cette ouverture ? »
« Quel est le taux de victoire associé à cette continuation ? »
« Quelle partie célèbre ressemble à cette position ? »

Tools :
opening_database, game_database, search_games, opening_explorer.

## Niveau 7 — Théorie des ouvertures

Questions :

« Quelle ouverture est-ce ? »
« Quels sont les coups théoriques ici ? »
« Jusqu'où cette position est-elle connue théoriquement ? »
« Quelle est la nouveauté de cette partie ? »
« Pourquoi 6...Bb4 est préféré à 6...Be7 ? »

Tools :

identify_opening, opening_book, opening_database.

## Niveau 8 — Endgames

Je te conseille d'en faire une catégorie spécifique parce qu'elle introduit des tools très puissants.

Questions :

« Est-ce gagné ou nul ? »
« Quel est le plan correct dans cette finale ? »
« Peux-tu trouver le mat ? »
« Cette finale de pions est-elle théoriquement gagnée ? »
« Quelle case doit atteindre le roi ? »
« Le joueur peut-il faire échec perpétuel ? »

Tools possibles :
tablebase, endgame_solver.

C'est particulièrement intéressant parce que tu peux obtenir des réponses quasiment ground-truth grâce aux tablebases.

## Niveau 9 — Raisonnement sous contraintes

Là, ton LLM doit répondre à des demandes plus complexes.

Par exemple :

« Je veux améliorer ma position sans échanger les dames. Quel plan proposes-tu ? »

ou :

« Trouve un coup qui améliore ma position tout en maintenant la défense du pion d5. »

Ou encore :

« Je suis en retard matériellement. Trouve les meilleurs moyens de créer des complications. »

Cela oblige le LLM à combiner plusieurs tools.

## Niveau 10 — Agent d'échecs complet

Enfin, le LLM ne répond plus simplement à des questions : il décide quand utiliser quel outil.

Exemple de question :

« Est-ce que je peux jouer 18.Qh5 ? »

Le LLM pourrait décider :

1. Vérifier la légalité
2. Analyser les réponses adverses
3. Chercher les tactiques
4. Évaluer les variantes
5. Vérifier éventuellement avec le moteur
6. Donner une conclusion

C'est probablement le niveau le plus intéressant pour ton projet, parce que ton vrai problème devient alors :