# 🔥 Firebase Functions Backend – FinBuddy

Este repositório contém o backend do projeto **FinBuddy**, implementado com Firebase Functions usando o padrão **Controller → Service → Repository**, integrado com Firebase Authentication e Firestore.

---

## 🛠️ Pré-requisitos

- Node.js `v18+`
- Firebase CLI (`npm install -g firebase-tools`)
- Conta no Firebase + projeto criado
- Firestore, Authentication e Functions habilitados no console

---

## 🚀 Instalação

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/finbuddy-functions.git
cd finbuddy-functions/functions

# Instale as dependências
npm install
```

---

## 🔄 Rodando localmente (com emulador)

> Certifique-se de ter o Firebase CLI e o emululador configurados

```bash
# Inicie os emuladores
firebase emulators:start
```

- A função `onCall` poderá ser testada no endereço do emulador ou diretamente pelo Firebase SDK.

---

## ✈️ Deploy no Firebase

Antes de deployar, faça login e selecione o projeto:

```bash
firebase login
firebase use --add
```

Depois:

```bash
npm run build   # se necessário
firebase deploy --only functions
```

---


## 🧪 Testes Locais

Você pode usar ferramentas como o [Postman](https://www.postman.com/) com o plugin de callable functions (ou curl com headers), ou testar diretamente via app com Firebase SDK.

---

## 📂 Licença

Este projeto é parte do TCC de Engenharia de Software da PUC Campinas e é de uso educacional.