diff --git a/README.md b/README.md
index 822d38dba716f81c22ea6e929a3c2a8d8bfe245f..5a377c2867689e63f784d495975ab6c482fa387b 100644
--- a/README.md
+++ b/README.md
@@ -20,27 +20,37 @@ AIRobot és un lloc web informatiu sobre robòtica, intel·ligència artificial
 - 
 ## Contact | Contacte
 Per a preguntes o suggeriments: [dractrek@gmail.com](mailto:dractrek@gmail.com)
 
 
 ---
 
 🤖  **English**
 <span style="color: green;">
 ## English 
 Welcome to yhe future of technology!
 </span>
 
 AIRobot is an informational website about robotics, artificial intelligence, and supercomputing, with content in both Catalan and English.
 
 ### Features
 - Information on advancements in robotics and AI.
 - Links to leading companies and organizations.
 - Multimedia content and videos.
 - Moderated discussions on trends and technology (coming soon).
 
 
 ## Contact | Contacte
 For questions or suggestions: [dractrek@gmail.com](mailto:dractrek@gmail.com)
 
+## Sudoku 3D prototype
+Aquesta versió del prototip afegeix un joc jugable a `index.html`, `styles.css` i `script.js`, amb el cub exterior, seguiment de dígits i també els tres talls centrals interns amb el cub central ocult representat fora de l'escena 3D.
 
+### Executar-lo localment
+Com que és una pàgina estàtica, n'hi ha prou amb obrir `index.html` al navegador o servir el directori amb un servidor simple, per exemple:
+
+```bash
+python -m http.server 8000
+```
+
+Després visita `http://localhost:8000`.
 
