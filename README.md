<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Mapa de Saúde (PWA - Caminhos Corrigidos) - Valença RJ</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#1976d2">

    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"
    />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <style>
      /* Seus estilos CSS permanecem aqui... */
      html, body { height: 100%; margin: 0; padding: 0; }
      #map { height: 100vh; width: 100%; }
      .legend { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); line-height: 1.5; max-height: 400px; overflow-y: auto; }
      .legend h4 { margin-top: 5px; margin-bottom: 5px; }
      .legend .color-box { width: 16px; height: 16px; display: inline-block; margin-right: 6px; border: 1px solid #555; vertical-align: middle; }
      .legend .icon-shape { border-radius: 50%; }
      .legend .route-shape { height: 8px; }
      .form-container { display: flex; flex-direction: column; gap: 8px; width: 180px; }
      .form-container label { font-size: 14px; margin-bottom: -4px; }
      .form-container input, .form-container select, .form-container button { padding: 6px; font-size: 14px; width: 100%; box-sizing: border-box; }
      .form-container button { background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .modal-backdrop { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
      .modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 300px; }
      .modal-content h3 { margin-top: 0; }
      .modal-content form { display: flex; flex-direction: column; gap: 10px; }
      .modal-content input { padding: 8px; font-size: 14px; }
      .modal-botoes { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; }
      .modal-botoes button { width: 100%; padding: 10px; border-radius: 4px; border: none; cursor: pointer; }
      .botao-salvar { background-color: #1976d2; color: white; }
      .botao-cancelar { background-color: #ccc; }
      .leaflet-control-text-buttons { display: flex; flex-direction: column; gap: 5px; }
      .leaflet-control-text-buttons .leaflet-bar { padding: 5px 10px; font-size: 14px; font-family: Arial, sans-serif; font-weight: bold; text-align: center; text-decoration: none; color: #333; border-radius: 4px; }
      .leaflet-control-text-buttons .leaflet-bar:hover { background-color: #f4f4f4; }
      .leaflet-control-text-buttons .leaflet-bar.modo-paciente-ativo { background-color: #c8e6c9; color: #255727; }
      .leaflet-draw-toolbar { display: none; }
    </style>
  </head>

  <body>
    <div id="map"></div>

     <div id="modal-comorb-backdrop" class="modal-backdrop">
      <div class="modal-content">
        <h3>Adicionar Nova Comorbidade</h3>
        <form id="form-nova-comorbidade">
          <label for="nova-comorb-nome">Nome:</label>
          <input type="text" id="nova-comorb-nome" placeholder="Ex: Asma" required>
          <label for="nova-comorb-corIcone">Cor do Ícone:</label>
          <input type="text" id="nova-comorb-corIcone" placeholder="Use nome em inglês (red) ou código (#FF0000)" required>
          <label for="nova-comorb-corRota">Cor da Rota (Paciente):</label>
          <input type="text" id="nova-comorb-corRota" placeholder="Use nome em inglês (red) ou código (#FF0000)" required>
          <div class="modal-botoes">
            <button type="button" id="botao-comorb-cancelar" class="botao-cancelar">Cancelar</button>
            <button type="submit" id="botao-comorb-salvar" class="botao-salvar">Salvar</button>
          </div>
        </form>
      </div>
    </div>
    <div id="modal-acs-backdrop" class="modal-backdrop">
      <div class="modal-content">
        <h3>Adicionar Área do Agente (ACS)</h3>
        <p>Por favor, informe os dados do agente para a área criada:</p>
        <form id="form-novo-acs">
          <label for="nova-acs-nome">Nome do Agente (ACS):</label>
          <input type="text" id="nova-acs-nome" placeholder="Ex: Maria Silva" required>
          <label for="nova-acs-cor">Cor da Área (Agente):</label>
          <input type="text" id="nova-acs-cor" placeholder="Use nome em inglês (blue) ou código (#0000FF)" required>
          <div class="modal-botoes">
            <button type="button" id="botao-acs-cancelar" class="botao-cancelar">Cancelar</button>
            <button type="submit" id="botao-acs-salvar" class="botao-salvar">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // 1️⃣ Inicialização do mapa (com limites)
      var centerLat = -22.2297562;
      var centerLng = -43.7085038;
      var centerPoint = [centerLat, centerLng];
      var lat_offset = 0.003; 
      var lng_offset = 0.004; 
      var southWest = L.latLng(centerLat - lat_offset, centerLng - lng_offset);
      var northEast = L.latLng(centerLat + lat_offset, centerLng + lng_offset);
      var bounds = L.latLngBounds(southWest, northEast);
      var mapZoom = 17; 

      var map = L.map("map", {
          center: centerPoint,
          zoom: mapZoom, 
          maxBounds: bounds,   
          minZoom: mapZoom - 1 
      });
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, 
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // --- Funções de Salvamento/Carregamento ---
      const STORAGE_KEYS = {
          COMORBIDADES: 'mapaSaude_comorbidades_v1', 
          AGENTES: 'mapaSaude_agentes_v1',
          PACIENTES: 'mapaSaude_pacientes_v1'
      };

      function saveData() {
          try {
              localStorage.setItem(STORAGE_KEYS.COMORBIDADES, JSON.stringify(comorbidadesConfig));
              localStorage.setItem(STORAGE_KEYS.AGENTES, JSON.stringify(agentesConfig));
              localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes));
              console.log("Dados salvos no LocalStorage.");
          } catch (e) {
              console.error("Erro ao salvar dados:", e);
              alert("Erro ao salvar os dados.");
          }
      }

      function loadData() {
          try {
              const savedComorbidades = localStorage.getItem(STORAGE_KEYS.COMORBIDADES);
              const savedAgentes = localStorage.getItem(STORAGE_KEYS.AGENTES);
              const savedPacientes = localStorage.getItem(STORAGE_KEYS.PACIENTES);

              comorbidadesConfig = savedComorbidades ? JSON.parse(savedComorbidades) : { ...defaultComorbidades };
              agentesConfig = savedAgentes ? JSON.parse(savedAgentes) : {};
              pacientes = savedPacientes ? JSON.parse(savedPacientes) : [];

              console.log("Dados carregados.");

          } catch (e) {
              console.error("Erro ao carregar dados:", e);
              alert("Erro ao carregar dados salvos. Usando dados padrão.");
              comorbidadesConfig = { ...defaultComorbidades };
              agentesConfig = {};
              pacientes = [];
          }
      }
      // --------------------------------------------------

      // 2️⃣ CONFIGURAÇÃO DE COMORBIDADES (Valores Padrão)
      var defaultComorbidades = {
        diabetes: { nome: "Diabetes", corIcone: "#FF0000", corRotaPaciente: "red" },
        hipertensao: { nome: "Hipertensão", corIcone: "#0000FF", corRotaPaciente: "blue" },
      };
      var comorbidadesConfig = {}; 

      // 3️⃣ CONFIGURAÇÃO DE AGENTES (ACS) (Começa Vazio)
      var agentesConfig = {}; 
      
      // 4️⃣ "Camadas" (Layers) de Controle
      var pacientesLayerGroup = L.layerGroup().addTo(map);
      var rotasPacientesLayerGroup = L.layerGroup().addTo(map);
      var areasAcsLayerGroup = L.layerGroup().addTo(map); 

      // 5️⃣ Funções dos PACIENTES
      function corRotaPorComorbidade(comorbKey) {
        return comorbidadesConfig[comorbKey] ? comorbidadesConfig[comorbKey].corRotaPaciente : "gray";
      }
      function desenharTodasRotasPacientes() {
        rotasPacientesLayerGroup.clearLayers(); 
        for (let i = 0; i < pacientes.length - 1; i++) {
          let p1 = pacientes[i]; let p2 = pacientes[i + 1];
          L.polyline([p1.coords, p2.coords], {
            color: corRotaPorComorbidade(p2.comorbidade), weight: 4,
          }).addTo(rotasPacientesLayerGroup);
        }
      }
      function removerPaciente(pacienteId) {
        pacientes = pacientes.filter(p => p.id !== pacienteId);
        pacientesLayerGroup.eachLayer(layer => {
          if (layer.pacienteId === pacienteId) pacientesLayerGroup.removeLayer(layer);
        });
        desenharTodasRotasPacientes();
        saveData(); 
      }
      var pacientes = []; 
      function adicionarPaciente(nome, comorbidadeKey, lat, lng) {
        var coords = [lat, lng];
        var pacienteId = Date.now(); 
        pacientes.push({ id: pacienteId, nome: nome, comorbidade: comorbidadeKey, coords: coords });
        var config = comorbidadesConfig[comorbidadeKey];
        var marker = L.circleMarker(coords, {
          radius: 8, fillColor: config.corIcone || 'gray', color: "#000",
          weight: 1, opacity: 1, fillOpacity: 0.9
        });
        marker.pacienteId = pacienteId; 
        marker.bindPopup(`<b>${nome}</b><br>Comorbidade: ${config.nome}<br><small>Clique direito para remover</small>`);
        marker.on('contextmenu', e => { L.DomEvent.preventDefault(e); removerPaciente(pacienteId); });
        pacientesLayerGroup.addLayer(marker);
        desenharTodasRotasPacientes();
        saveData(); 
      }

      function redesenharPacientes() {
          pacientesLayerGroup.clearLayers(); 
          pacientes.forEach(p => {
              var config = comorbidadesConfig[p.comorbidade];
              if (!config) { 
                  console.warn("Comorbidade não encontrada para paciente:", p);
                  return; 
              }
              var marker = L.circleMarker(p.coords, {
                  radius: 8, fillColor: config.corIcone || 'gray', color: "#000",
                  weight: 1, opacity: 1, fillOpacity: 0.9
              });
              marker.pacienteId = p.id;
              marker.bindPopup(`<b>${p.nome}</b><br>Comorbidade: ${config.nome}<br><small>Clique direito para remover</small>`);
              marker.on('contextmenu', e => { L.DomEvent.preventDefault(e); removerPaciente(p.id); });
              pacientesLayerGroup.addLayer(marker);
          });
          desenharTodasRotasPacientes(); 
      }

      // 6️⃣ Funções dos AGENTES (ACS) - Áreas (Polígonos)
      function removerAreaAcs(e) {
        var layer = e.target;
        var key = layer.acsKey;
        var geojson = layer.areaGeoJSON;
        if (agentesConfig[key] && agentesConfig[key].areasGeoJSON) {
            agentesConfig[key].areasGeoJSON = agentesConfig[key].areasGeoJSON.filter(r => 
                JSON.stringify(r.geometry.coordinates) !== JSON.stringify(geojson.geometry.coordinates)
            );
            areasAcsLayerGroup.removeLayer(layer);
            if (agentesConfig[key].areasGeoJSON.length === 0) {
                delete agentesConfig[key];
            }
            atualizarLegenda(); 
            saveData(); 
        } else {
            console.error("Erro ao remover área: Agente ou área não encontrada nos dados.", key, geojson);
            areasAcsLayerGroup.removeLayer(layer); 
        }
      }

      function desenharAreaAcs(key, areaGeoJSON) {
          if (!agentesConfig[key]) {
              console.error("Tentando desenhar área para agente inexistente:", key);
              return;
          }
          var cor = agentesConfig[key].cor;
          var nome = agentesConfig[key].nome;
          var areaLayer = L.geoJSON(areaGeoJSON, {
          style: { 
              color: cor, weight: 3, opacity: 0.7,
              fillColor: cor, fillOpacity: 0.2 
          }
          });
          areaLayer.acsKey = key;
          areaLayer.areaGeoJSON = areaGeoJSON; 
          areaLayer.bindPopup(`<b>Agente:</b> ${nome}<br><small>Clique direito para remover área</small>`);
          areaLayer.on('contextmenu', removerAreaAcs);
          areasAcsLayerGroup.addLayer(areaLayer);
      }

      function carregarEdesenharAreas() { 
          areasAcsLayerGroup.clearLayers(); 
          for (var key in agentesConfig) {
              if (agentesConfig[key] && Array.isArray(agentesConfig[key].areasGeoJSON)) {
                  agentesConfig[key].areasGeoJSON.forEach(area => {
                      if (area && area.geometry && area.geometry.coordinates) {
                          desenharAreaAcs(key, area);
                      } else {
                          console.warn("GeoJSON de área inválido para agente:", key, area);
                      }
                  });
              } else {
                  if (agentesConfig[key]) {
                     agentesConfig[key].areasGeoJSON = [];
                  }
                  console.warn("Estrutura de dados inválida para agente:", key);
              }
          }
      }

      // 7️⃣ Função de Clique para Adicionar Paciente
      function onMapaClickPaciente(e) {
        if (e.originalEvent.target.classList.contains("leaflet-marker-icon") || 
            e.originalEvent.target.tagName === "svg" || 
            e.originalEvent.target.tagName === "path" || 
            e.originalEvent.target.closest(".leaflet-control")) { 
          map.once('click', onMapaClickPaciente); 
          return; 
        }
        
        var lat = e.latlng.lat, lng = e.latlng.lng;
        var container = L.DomUtil.create("div", "form-container");
        var labelNome = L.DomUtil.create("label", "", container);
        labelNome.innerHTML = "Nome:";
        var inputNome = L.DomUtil.create("input", "", container);
        inputNome.type = "text"; inputNome.placeholder = "Nome do paciente";
        var labelComorb = L.DomUtil.create("label", "", container);
        labelComorb.innerHTML = "Comorbidade:";
        var selectComorb = L.DomUtil.create("select", "", container);
        for (var key in comorbidadesConfig) { 
          var config = comorbidadesConfig[key];
          var option = L.DomUtil.create("option", "", selectComorb);
          option.value = key; option.innerHTML = config.nome;
        }
        var buttonAdd = L.DomUtil.create("button", "", container);
        buttonAdd.type = "button"; buttonAdd.innerHTML = "Adicionar";
        
        var popup = L.popup().setLatLng(e.latlng).setContent(container).openOn(map);
        
        popup.on('remove', function() {
          resetarBotoesPaciente(); 
        });

        L.DomEvent.on(buttonAdd, "click", function () {
            var nome = inputNome.value, comorbidadeKey = selectComorb.value;
            if (nome && comorbidadeKey) {
              adicionarPaciente(nome, comorbidadeKey, lat, lng);
              map.closePopup(popup); 
            } else if (!nome) inputNome.style.border = "2px solid red";
        });
      }
      
      // 8️⃣ Legenda
      var legend = L.control({ position: "bottomright" });
      function gerarConteudoLegenda() {
        var html = "<h4>Áreas (Agentes)</h4>"; 
        for (var key in agentesConfig) { 
          var config = agentesConfig[key];
          html += `<div><span class="color-box route-shape" style="background-color: ${config.cor}; border-color: ${config.cor};"></span>${config.nome}</div>`;
        }
        html += "<h4 style='margin-top: 10px;'>Pacientes (Comorbidades)</h4>";
        for (var key in comorbidadesConfig) { 
          var config = comorbidadesConfig[key];
          html += `<div><span class="color-box icon-shape" style="background-color: ${config.corIcone};"></span> ${config.nome}</div>`;
        }
        return html;
      }
      function atualizarLegenda() {
        if (legend.getContainer()) legend.getContainer().innerHTML = gerarConteudoLegenda();
      }
      legend.onAdd = function (map) {
        var div = L.DomUtil.create("div", "info legend");
        return div;
      };
      legend.addTo(map);

      // 9️⃣ Controles de Ferramentas (com Leaflet.draw)
      var btnComorb, btnAcs, btnPaciente; 
      var drawHandler = null; 

      function resetarBotoesPaciente() {
          if (btnPaciente) {
            btnPaciente.innerHTML = "Adicionar Paciente";
            btnPaciente.classList.remove("modo-paciente-ativo");
          }
          if (btnAcs) btnAcs.style.display = "block";
          if (btnComorb) btnComorb.style.display = "block";
          map.off('click', onMapaClickPaciente); 
      }
      
      function resetarBotoesAcs() { 
          if (btnPaciente) btnPaciente.style.display = "block";
          if (btnAcs) {
              btnAcs.innerHTML = "Adicionar Área ACS"; 
              btnAcs.style.display = "block";
          }
          if (btnComorb) btnComorb.style.display = "block";
          
          if (drawHandler) {
            drawHandler.disable(); 
            drawHandler = null;
          }
          map.off('click', onMapaClickPaciente); 
      }

      var toolControls = L.control({ position: "topleft" });

      toolControls.onAdd = function (map) {
          var container = L.DomUtil.create("div", "leaflet-control-text-buttons");
          L.DomEvent.disableClickPropagation(container);

          btnComorb = L.DomUtil.create("a", "leaflet-bar", container);
          btnComorb.href = "#";
          btnComorb.title = "Adicionar nova doença/comorbidade";
          btnComorb.innerHTML = "Adicionar Doença"; 
          L.DomEvent.on(btnComorb, "click", e => {
              L.DomEvent.preventDefault(e);
              resetarBotoesPaciente(); 
              resetarBotoesAcs(); 
              modalComorbBackdrop.style.display = "flex"; 
          });

          btnAcs = L.DomUtil.create("a", "leaflet-bar", container);
          btnAcs.href = "#";
          btnAcs.title = "Desenhar área de atuação de Agente (ACS) no mapa";
          btnAcs.innerHTML = "Adicionar Área ACS"; 

          btnPaciente = L.DomUtil.create("a", "leaflet-bar", container);
          btnPaciente.href = "#";
          btnPaciente.title = "Adicionar paciente ao mapa";
          btnPaciente.innerHTML = "Adicionar Paciente";
          
          L.DomEvent.on(btnAcs, "click", e => {
              L.DomEvent.preventDefault(e);
              resetarBotoesPaciente(); 
              
              btnComorb.style.display = "none";
              btnPaciente.style.display = "none";
              btnAcs.innerHTML = "Desenhando Área..."; 
              btnAcs.style.display = "block"; 
              
              drawHandler = new L.Draw.Polygon(map, {
                  shapeOptions: { color: '#FF00FF', weight: 3, opacity: 0.7, fillColor: '#FF00FF', fillOpacity: 0.2 } 
              });
              drawHandler.enable();
              
              map.once('draw:drawstop', function(e) {
                resetarBotoesAcs();
              });
              map.once('draw:created', function(e) {
                var layer = e.layer;
                tempAreaGeoJSON = layer.toGeoJSON(); 
                mostrarModalAcs();
              });
          });
          
          L.DomEvent.on(btnPaciente, "click", e => {
              L.DomEvent.preventDefault(e);
              resetarBotoesAcs(); 
              
              btnPaciente.innerHTML = "Clique no mapa...";
              btnPaciente.classList.add("modo-paciente-ativo");
              btnAcs.style.display = "none";
              btnComorb.style.display = "none";
              map.once('click', onMapaClickPaciente);
          });

          return container;
      };
      toolControls.addTo(map);


      // 10️⃣ Lógica do Modal de Comorbidade
      var modalComorbBackdrop = document.getElementById("modal-comorb-backdrop");
      var formNovaComorbidade = document.getElementById("form-nova-comorbidade");
      function esconderModalComorb() {
        modalComorbBackdrop.style.display = "none";
        formNovaComorbidade.reset();
      }
      document.getElementById("botao-comorb-cancelar").addEventListener("click", esconderModalComorb);
      formNovaComorbidade.addEventListener("submit", function(e) {
        e.preventDefault();
        var nome = document.getElementById("nova-comorb-nome").value;
        var corIcone = document.getElementById("nova-comorb-corIcone").value;
        var corRota = document.getElementById("nova-comorb-corRota").value;
        var key = nome.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key && !comorbidadesConfig[key]) {
          if (!corIcone.match(/^(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)$/) || !corRota.match(/^(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)$/)) {
            alert("Formato de cor inválido."); return;
          }
          comorbidadesConfig[key] = { 
            nome: nome, 
            corIcone: corIcone, 
            corRotaPaciente: corRota 
          };
          atualizarLegenda();
          saveData(); 
          esconderModalComorb();
        } else alert("Erro: Chave de nome inválida ou já existe.");
      });

      // 11️⃣ Lógica do Modal de ACS (Área)
      var modalAcsBackdrop = document.getElementById("modal-acs-backdrop");
      var formNovoAcs = document.getElementById("form-novo-acs");
      var tempAreaGeoJSON = null; 
      
      function mostrarModalAcs() { modalAcsBackdrop.style.display = "flex"; }
      function esconderModalAcs() {
        modalAcsBackdrop.style.display = "none";
        formNovoAcs.reset();
        tempAreaGeoJSON = null; 
      }
      document.getElementById("botao-acs-cancelar").addEventListener("click", esconderModalAcs);
      
      formNovoAcs.addEventListener("submit", function(e) {
        e.preventDefault();
        var nome = document.getElementById("nova-acs-nome").value;
        var cor = document.getElementById("nova-acs-cor").value; 
        var key = nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        if (!key || !tempAreaGeoJSON) { 
          alert("Erro: Nome ou Área inválida."); return;
        }
        if (!cor.match(/^(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)$/)) {
            alert("Formato de cor inválido."); return;
        }
        if (!agentesConfig[key]) {
          agentesConfig[key] = { nome: nome, cor: cor, areasGeoJSON: [] }; 
        } else if (!Array.isArray(agentesConfig[key].areasGeoJSON)) {
            agentesConfig[key].areasGeoJSON = [];
        }

        agentesConfig[key].areasGeoJSON.push(tempAreaGeoJSON); 
        desenharAreaAcs(key, tempAreaGeoJSON); 
        atualizarLegenda();
        saveData(); 
        esconderModalAcs();
      });

      // 12️⃣ Inicialização
      loadData(); 
      carregarEdesenharAreas(); 
      redesenharPacientes(); 
      atualizarLegenda(); 

      // (NOVO) Registra o Service Worker (Caminho Relativo)
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./service-worker.js') 
            .then((reg) => {
              console.log('Service worker registered successfully:', reg.scope);
            }).catch((err) => {
              console.error('Service worker registration failed:', err);
            });
        });
      }

    </script>
  </body>
</html>
