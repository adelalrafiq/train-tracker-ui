# 🚆 TrainTracker UI

Frontend application for the TrainTracker system.
It simulates a real train station departure board with live data, autocomplete search, and an interactive map.

---

## 🌍 Live Demo

🔗 https://train-tracker-ui-fdfc.vercel.app/liveboard

---

## ✨ Features

* 🚉 Live departure board
* 🔄 Auto refresh every 30 seconds
* 🔍 Station search with autocomplete
* 🗺️ Interactive map (Mapbox)
* ⏰ Real-time clock
* 📱 Responsive design (mobile + tablet + desktop)

---

## 🛠️ Tech Stack

* Angular
* Tailwind CSS
* Mapbox GL JS

---

## 📂 Project Structure

```id="f1"
src/
 ├── app/
 │   ├── pages/
 │   ├── services/
 │   └── components/
 ├── environments/
 └── assets/
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash id="f2"
npm install
```

---

### 2. Run locally

```bash id="f3"
ng serve
```

App runs on:

```id="f4"
http://localhost:4200
```

---

## 🔑 Environment Configuration

Create:

```id="f5"
src/environments/environment.ts
```

```ts id="f6"
export const environment = {
  api: {
    baseUrl: 'https://traintracker-1.onrender.com/api/liveboard/sint-Niklaas'
  },
  mapboxToken: 'YOUR_MAPBOX_TOKEN'
};
```

---

## 🔗 API Integration

The app connects to:

```id="f7"
https://traintracker-1.onrender.com/api
```

---

## 🧠 How It Works

* User types a station name
* Autocomplete suggests stations
* Selected station triggers API call
* Data updates every 30 seconds
* Map updates location dynamically

---

## 🚀 Build

```bash id="f8"
ng build
```

Output:

```id="f9"
dist/train-tracker-ui
```

---

## 🌐 Deployment

Deployed using:

* Vercel

---

## ⚠️ Notes

* Backend may sleep (Render free tier)
* First request may take a few seconds
* Mapbox token is required

---

## 🔮 Future Improvements

* ⚡ Real-time updates (SignalR)
* 🧠 Smart caching
* 📱 PWA support
* 🎨 UI animations

---

## 🔗 Related

Backend API:
https://traintracker-1.onrender.com

---

## 👨‍💻 Author

Adel Al-Rafiq 🚀
