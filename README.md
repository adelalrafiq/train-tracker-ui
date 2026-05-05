# 🚆 TrainTracker UI

A modern real-time train departure board web application inspired by real European station displays.

---

![Angular](https://img.shields.io/badge/Angular-21-red)
![Status](https://img.shields.io/badge/status-live-success)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🌍 Live Demo

🔗 https://train-tracker-ui-fdfc.vercel.app/liveboard

---

## 📸 Preview

*(Add screenshot here later)*

---

## ✨ Features

* 🚉 Live departure board
* 🔄 Auto refresh every 30 seconds
* 🔍 Station search with autocomplete
* 🗺️ Interactive map (Mapbox)
* ⏰ Real-time clock
* 📱 Responsive design (mobile, tablet, desktop)

---

## 🛠️ Tech Stack

* Angular
* Tailwind CSS
* Mapbox GL JS

---

## 📂 Project Structure

```
src/
 ├── app/
 │   ├── models/
 │   ├── pages/
 │   └── services/
 └── environments/
```

---

## ▶️ How to Use

1. Type a station name (e.g. **Gen**)
2. Select from autocomplete
3. View live departures
4. Watch the map update automatically

---

## ⚙️ Setup

### Install dependencies

```bash
npm install
```

---

### Run locally

```bash
ng serve
```

App runs on:

```
http://localhost:4200/liveboard
```

---

## 🔑 Environment Configuration

Create:

```
src/environments/environment.ts
```

```ts
export const environment = {
  api: {
    baseUrl: 'https://traintracker-1.onrender.com/api',
    liveboard: '/liveboard',
    stations: '/stations'
  },
  mapboxToken: 'YOUR_MAPBOX_TOKEN'
};
```

---

## 🔗 API Integration

### Base URL

https://traintracker-1.onrender.com/api

---

### 🚉 Liveboard

**GET** `/liveboard/{station}`

Example:

```
https://traintracker-1.onrender.com/api/liveboard/Sint-Niklaas
```

Response:

```json
{
  "stationName": "Sint-Niklaas",
  "latitude": 51.171472,
  "longitude": 4.142966,
  "rows": [
    {
      "directionName": "Antwerpen-Centraal",
      "departureTime": "2026-05-04T08:00:00+00:00",
      "platform": "4",
      "vehicleInfoShortname": "IC 730",
      "delayMinutes": 0
    }
  ]
}
```

---

### 🔍 Stations Search

**GET** `/stations?query={text}`

Example:

```
https://traintracker-1.onrender.com/api/stations?query=Gen
```

Response:

```json
[
  { "name": "Gent-Sint-Pieters" },
  { "name": "Genk" }
]
```

---

### 📄 API Documentation (Swagger)

Interactive API documentation available at:

🔗 https://traintracker-1.onrender.com/swagger

---

## 🚀 Build

```bash
ng build
```

Output:

```
dist/train-tracker-ui
```

---

## 🌐 Deployment

Deployed using:

* Vercel

---

## ⚠️ Notes

* Backend may sleep (free tier on Render)
* First request may take a few seconds
* Mapbox token is required

---

## 🔮 Future Improvements

* ⚡ Real-time updates using SignalR
* 🧠 Smart caching
* 📱 PWA support
* 🎨 UI animations

---

## 🔗 Related

Backend API:
https://traintracker-1.onrender.com

Backend repository:
https://github.com/adelalrafiq/TrainTracker

---

## 👨‍💻 Author

**Adel Al-Rafiq** 🚀
Full Stack Developer  
