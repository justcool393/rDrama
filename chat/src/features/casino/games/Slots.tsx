import React from "react";
import "./Slots.css";

export function Slots() {
  return (
    <div className="Slots">
      <div className="Slots-reel">
        <img
          alt="slot reel"
          src="/i/slot_reel.webp"
          className="Slots-reel--1"
          style={{ width: 128, height: 640 }}
        />
      </div>
      <div className="Slots-reel">
        <img
          alt="slot reel"
          src="/i/slot_reel.webp"
          className="Slots-reel--2"
          style={{ width: 128, height: 640 }}
        />
      </div>
      <div className="Slots-reel">
        <img
          alt="slot reel"
          src="/i/slot_reel.webp"
          className="Slots-reel--3"
          style={{ width: 128, height: 640 }}
        />
      </div>
    </div>
  );
}
