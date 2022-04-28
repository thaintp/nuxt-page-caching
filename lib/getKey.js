export default function getKey({ appendHost, req, key }) {
  const host = req && req.headers ? req.headers.host : "";

  return appendHost ? `${key}-${host}` : key;
}
