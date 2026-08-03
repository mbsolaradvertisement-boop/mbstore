const group = (title, items) => ({ title, items });

export const categories = [
  { name: "Solar Modules", children: [group("Monocrystalline", ["Mono PERC", "TOPCon", "Bifacial", "Half Cut", "Glass to Glass"]), group("Polycrystalline", ["Poly 330W", "Poly 450W"]), group("Commercial", ["Utility Scale", "Rooftop"]), group("Residential", ["Home Solar"])] },
  { name: "Inverters", children: [group("Inverter Types", ["String Inverter", "Hybrid", "Micro", "Central"]), group("Applications", ["Residential", "Commercial", "Industrial"]), group("Grid", ["On Grid", "Off Grid"])] },
  { name: "Batteries", children: [group("Battery Types", ["Lithium", "Tubular", "Gel", "Lead Acid"]), group("Applications", ["Solar Storage", "UPS Backup", "Industrial"]), group("Capacity", ["100Ah", "150Ah", "200Ah"])] },
  { name: "Solar Kits", children: [group("Residential Kits", ["1kW Kit", "3kW Kit", "5kW Kit"]), group("Commercial Kits", ["10kW Kit", "25kW Kit"]), group("Industrial Kits", ["50kW Kit", "100kW Kit"])] },
  { name: "Cables", children: [group("Cable Types", ["DC Cable", "AC Cable", "Control Cable"]), group("Conductor", ["Copper", "Aluminium"]), group("Sizes", ["4 sq mm", "6 sq mm", "10 sq mm"])] },
  { name: "Structures", children: [group("Mounting", ["Ground Mount", "Roof Mount", "Pole Mount"]), group("Material", ["Galvanized Steel", "Aluminium"]), group("Application", ["Residential", "Commercial"])] },
  { name: "Solar BOS", children: [group("Protection", ["SPD", "Fuse", "Isolator"]), group("Connection", ["MC4", "Combiner Box"]), group("Monitoring", ["Data Logger", "Smart Meter"])] },
  { name: "Electrical", children: [group("Protection", ["MCB", "MCCB", "RCCB"]), group("Distribution", ["Panels", "Busbars"]), group("Control", ["Contactors", "Relays"])] },
  { name: "Automation", children: [group("Controllers", ["PLC", "HMI"]), group("Drives", ["VFD", "Servo Drive"]), group("Field Devices", ["Sensors", "Encoders"])] },
  { name: "Motors", children: [group("Motor Types", ["AC Motor", "DC Motor", "Servo", "Stepper"]), group("Applications", ["Pump", "Conveyor", "Machine Tool"]), group("Efficiency", ["IE2", "IE3", "IE4"])] },
  { name: "Switchgear", children: [group("Breakers", ["MCB", "MCCB", "ACB"]), group("High Voltage", ["VCB", "RMU"]), group("Safety", ["RCCB", "RCBO"])] },
  { name: "Accessories", children: [group("Connectors", ["MC4", "Cable Lug", "Terminal Block"]), group("Tools", ["Crimping Tool", "Multimeter"]), group("Enclosures", ["Junction Box", "Control Box"])] },
];

export const categoryNames = categories.map(({ name }) => name);
