import React from "react";
import { Avatar, Space, Tooltip, Typography } from "antd";

interface Props {
  amount?: number;
  kind: CasinoCurrency;
}

const { Text } = Typography;

const data = {
  coins: {
    alt: "coins",
    title: "Coins",
    src: "/i/rDrama/coins.webp?v=3010",
  },
  procoins: {
    alt: "procoins",
    title: "Procoins",
    src: "/i/marseybux.webp?v=2000",
  },
};

export function Currency({ amount, kind }: Props) {
  const { alt, title, src } = data[kind];

  return (
    <Tooltip title={title}>
      <Space>
        <Avatar size="small" alt={alt} src={src} shape="circle" />
        {typeof amount !== "undefined" && <Text>{amount}</Text>}
      </Space>
    </Tooltip>
  );
}
