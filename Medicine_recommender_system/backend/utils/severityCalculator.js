const calculateSeverity = (reason, symptoms) => {
  const combined = `${reason} ${symptoms}`.toLowerCase();
  
  const highKeywords = ['severe', 'emergency', 'heart', 'chest pain', 'breathing', 'bleeding', 'unconscious', 'stroke', 'fainting', 'fracture'];
  const mediumKeywords = ['moderate', 'fever', 'vomiting', 'pain', 'infection', 'burn', 'swelling', 'dizziness'];
  
  for (let keyword of highKeywords) {
    if (combined.includes(keyword)) {
      return 'high';
    }
  }
  
  for (let keyword of mediumKeywords) {
    if (combined.includes(keyword)) {
      return 'medium';
    }
  }
  
  return 'low';
};

module.exports = { calculateSeverity };
