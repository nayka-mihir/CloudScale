import { getHealthInfo, getGeneralInfo, getServerInfo as fetchServerInfo } from '../services/instanceService.js';

export const getHealth = (req, res) => {
  const healthData = getHealthInfo();
  res.status(200).json(healthData);
};

export const getInfo = (req, res) => {
  const infoData = getGeneralInfo();
  res.status(200).json(infoData);
};

export const getServerInfo = async (req, res, next) => {
  try {
    const serverInfo = await fetchServerInfo(req);
    res.status(200).json(serverInfo);
  } catch (err) {
    next(err);
  }
};
